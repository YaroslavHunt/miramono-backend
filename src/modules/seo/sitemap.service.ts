import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Article, ArticleStatus } from '../blog/entities/article.entity';
import { GalleryCase } from '../gallery/entities/gallery-case.entity';

interface SitemapEntry {
  loc: string;
  lastmod?: Date | null;
}

const STATIC_PATHS = ['/', '/services', '/doctors', '/blog', '/gallery', '/contacts'];

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

@Injectable()
export class SitemapService {
  constructor(
    @InjectRepository(Article)
    private readonly articles: Repository<Article>,
    @InjectRepository(GalleryCase)
    private readonly gallery: Repository<GalleryCase>,
    private readonly config: ConfigService,
  ) {}

  buildSitemap(): Promise<string> {
    return this.compose();
  }

  buildRobots(): string {
    return [
      'User-agent: *',
      'Allow: /',
      'Disallow: /api/',
      '',
      `Sitemap: ${this.siteUrl()}/sitemap.xml`,
      '',
    ].join('\n');
  }

  private async compose(): Promise<string> {
    const site = this.siteUrl();
    const [articles, cases] = await Promise.all([
      this.articles.find({
        where: { status: ArticleStatus.Published },
        order: { publishedAt: 'DESC' },
      }),
      this.gallery.find({ where: { isPublished: true }, order: { sortOrder: 'ASC' } }),
    ]);

    const entries: SitemapEntry[] = [
      ...STATIC_PATHS.map((path) => ({ loc: `${site}${path}` })),
      ...articles.map((article) => ({
        loc: `${site}/blog/${article.slug}`,
        lastmod: article.updatedAt,
      })),
      ...cases.map((item) => ({ loc: `${site}/gallery/${item.id}`, lastmod: item.updatedAt })),
    ];

    const body = entries
      .map((entry) => {
        const lastmod = entry.lastmod
          ? `<lastmod>${new Date(entry.lastmod).toISOString()}</lastmod>`
          : '';
        return `<url><loc>${escapeXml(entry.loc)}</loc>${lastmod}</url>`;
      })
      .join('');

    return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`;
  }

  private siteUrl(): string {
    return this.config.getOrThrow<string>('seo.siteUrl');
  }
}
