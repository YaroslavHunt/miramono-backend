import { ConflictException, NotFoundException } from '@nestjs/common';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { Repository } from 'typeorm';

import { CacheService } from '../../common/cache/cache.service';
import { createCacheMock } from '../../common/cache/cache.mock';
import { BlogService } from './blog.service';
import { Article, ArticleStatus } from './entities/article.entity';

describe('BlogService', () => {
  let articles: {
    findAndCount: jest.Mock;
    findOne: jest.Mock;
    exists: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    softRemove: jest.Mock;
  };
  let cache: ReturnType<typeof createCacheMock>;
  let service: BlogService;

  beforeEach(() => {
    articles = {
      findAndCount: jest.fn().mockResolvedValue([[], 0]),
      findOne: jest.fn(),
      exists: jest.fn().mockResolvedValue(false),
      create: jest.fn((data: Partial<Article>) => data as Article),
      save: jest.fn((entity: Partial<Article>) =>
        Promise.resolve({ id: 'a1', ...entity } as Article),
      ),
      softRemove: jest.fn(),
    };
    cache = createCacheMock();
    const i18n = { translate: jest.fn((key: string) => key) };
    service = new BlogService(
      articles as unknown as Repository<Article>,
      cache as unknown as CacheService,
      i18n as unknown as I18nService,
    );
  });

  describe('listPublished', () => {
    it('returns only published articles', async () => {
      await service.listPublished({ page: 1, limit: 20, skip: 0 });
      const options = articles.findAndCount.mock.calls[0][0] as {
        where: { status: ArticleStatus };
      };
      expect(options.where.status).toBe(ArticleStatus.Published);
    });
  });

  describe('findPublishedBySlug', () => {
    it('throws when the slug is not a published article', async () => {
      articles.findOne.mockResolvedValue(null);
      await expect(service.findPublishedBySlug('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      const options = articles.findOne.mock.calls[0][0] as {
        where: { slug: string; status: ArticleStatus };
      };
      expect(options.where.status).toBe(ArticleStatus.Published);
    });
  });

  describe('create', () => {
    it('rejects a duplicate slug', async () => {
      articles.exists.mockResolvedValue(true);
      await expect(
        service.create({ title: 'X', slug: 'taken', content: 'body' }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(articles.save).not.toHaveBeenCalled();
    });

    it('leaves publishedAt null for a draft', async () => {
      const created = await service.create({ title: 'Draft', slug: 'draft', content: 'body' });
      expect(created.publishedAt).toBeNull();
    });

    it('stamps publishedAt when created as published', async () => {
      const created = await service.create({
        title: 'Live',
        slug: 'live',
        content: 'body',
        status: ArticleStatus.Published,
      });
      expect(created.publishedAt).toBeInstanceOf(Date);
    });
  });

  describe('update', () => {
    it('stamps publishedAt on first publish and clears it when unpublished', async () => {
      articles.findOne.mockResolvedValue({
        id: 'a1',
        slug: 'live',
        status: ArticleStatus.Draft,
        publishedAt: null,
      });
      const published = await service.update('a1', { status: ArticleStatus.Published });
      expect(published.publishedAt).toBeInstanceOf(Date);

      articles.findOne.mockResolvedValue({
        id: 'a1',
        slug: 'live',
        status: ArticleStatus.Published,
        publishedAt: new Date(),
      });
      const draft = await service.update('a1', { status: ArticleStatus.Draft });
      expect(draft.publishedAt).toBeNull();
    });

    it('invalidates the article cache after a write', async () => {
      articles.findOne.mockResolvedValue({ id: 'a1', slug: 'live', status: ArticleStatus.Draft });
      await service.update('a1', { title: 'New title' });
      expect(cache.invalidate).toHaveBeenCalledWith('articles');
    });
  });

  describe('localization', () => {
    afterEach(() => jest.restoreAllMocks());

    it('overlays the english translation when the request language is en', async () => {
      jest.spyOn(I18nContext, 'current').mockReturnValue({ lang: 'en' } as I18nContext);
      articles.findOne.mockResolvedValue({
        slug: 'x',
        status: ArticleStatus.Published,
        title: 'Догляд за зубами',
        excerpt: null,
        content: 'Український текст',
        translations: { en: { title: 'Dental care', content: 'English body' } },
      });
      const article = await service.findPublishedBySlug('x');
      expect(article.title).toBe('Dental care');
      expect(article.content).toBe('English body');
    });

    it('falls back to ukrainian content when no translation exists', async () => {
      jest.spyOn(I18nContext, 'current').mockReturnValue({ lang: 'en' } as I18nContext);
      articles.findOne.mockResolvedValue({
        slug: 'x',
        status: ArticleStatus.Published,
        title: 'Догляд за зубами',
        excerpt: null,
        content: 'Український текст',
        translations: null,
      });
      const article = await service.findPublishedBySlug('x');
      expect(article.title).toBe('Догляд за зубами');
    });
  });
});
