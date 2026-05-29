import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { FindOptionsWhere, Repository } from 'typeorm';

import { CacheService } from '../../common/cache/cache.service';
import { PaginatedResult, paginated } from '../../common/dto/paginated-result';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ArticleQueryDto } from './dto/article-query.dto';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { Article, ArticleStatus } from './entities/article.entity';

const CACHE_NAMESPACE = 'articles';
const CACHE_TTL_MS = 60_000;

@Injectable()
export class BlogService {
  constructor(
    @InjectRepository(Article)
    private readonly articles: Repository<Article>,
    private readonly cache: CacheService,
    private readonly i18n: I18nService,
  ) {}

  async listPublished(query: PaginationQueryDto): Promise<PaginatedResult<Article>> {
    const suffix = this.cache.serializeQuery({ page: query.page, limit: query.limit });
    const key = await this.cache.namespacedKey(CACHE_NAMESPACE, `list:${suffix}`);
    const result = await this.cache.wrap(key, CACHE_TTL_MS, async () => {
      const [items, total] = await this.articles.findAndCount({
        where: { status: ArticleStatus.Published },
        order: { publishedAt: 'DESC', createdAt: 'DESC' },
        skip: query.skip,
        take: query.limit,
      });
      return paginated(items, total, query);
    });
    return { ...result, items: result.items.map((article) => this.localize(article)) };
  }

  async findPublishedBySlug(slug: string): Promise<Article> {
    const key = await this.cache.namespacedKey(CACHE_NAMESPACE, `slug:${slug}`);
    const article = await this.cache.wrap(key, CACHE_TTL_MS, () =>
      this.articles.findOne({ where: { slug, status: ArticleStatus.Published } }),
    );
    if (!article) {
      throw new NotFoundException(this.i18n.translate('errors.article_not_found'));
    }
    return this.localize(article);
  }

  async list(query: ArticleQueryDto): Promise<PaginatedResult<Article>> {
    const where: FindOptionsWhere<Article> = {};
    if (query.status) {
      where.status = query.status;
    }

    const [items, total] = await this.articles.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: query.skip,
      take: query.limit,
    });
    return paginated(items, total, query);
  }

  async getById(id: string): Promise<Article> {
    const article = await this.articles.findOne({ where: { id } });
    if (!article) {
      throw new NotFoundException('Article not found');
    }
    return article;
  }

  async create(dto: CreateArticleDto): Promise<Article> {
    await this.assertSlugFree(dto.slug);
    const article = this.articles.create({
      ...dto,
      publishedAt: dto.status === ArticleStatus.Published ? new Date() : null,
    });
    const saved = await this.articles.save(article);
    await this.cache.invalidate(CACHE_NAMESPACE);
    return saved;
  }

  async update(id: string, dto: UpdateArticleDto): Promise<Article> {
    const article = await this.getById(id);
    if (dto.slug && dto.slug !== article.slug) {
      await this.assertSlugFree(dto.slug);
    }
    Object.assign(article, dto);
    if (dto.status) {
      article.publishedAt =
        dto.status === ArticleStatus.Published ? (article.publishedAt ?? new Date()) : null;
    }
    const saved = await this.articles.save(article);
    await this.cache.invalidate(CACHE_NAMESPACE);
    return saved;
  }

  async remove(id: string): Promise<void> {
    const article = await this.getById(id);
    await this.articles.softRemove(article);
    await this.cache.invalidate(CACHE_NAMESPACE);
  }

  private localize(article: Article): Article {
    const lang = I18nContext.current()?.lang;
    const en = article.translations?.en;
    const localized: Article = { ...article };
    if (lang && lang.toLowerCase().startsWith('en') && en) {
      localized.title = en.title ?? article.title;
      localized.excerpt = en.excerpt ?? article.excerpt;
      localized.content = en.content ?? article.content;
    }
    // the raw per-language store is an admin-only field; public reads expose only the resolved locale
    localized.translations = null;
    return localized;
  }

  private async assertSlugFree(slug: string): Promise<void> {
    if (await this.articles.exists({ where: { slug } })) {
      throw new ConflictException('Slug already taken');
    }
  }
}
