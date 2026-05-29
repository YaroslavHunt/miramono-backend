import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';

import { Article } from '../blog/entities/article.entity';
import { GalleryCase } from '../gallery/entities/gallery-case.entity';
import { SitemapService } from './sitemap.service';

describe('SitemapService', () => {
  const articles = { find: jest.fn().mockResolvedValue([{ slug: 'care', updatedAt: new Date() }]) };
  const gallery = { find: jest.fn().mockResolvedValue([{ id: 'g-1', updatedAt: null }]) };
  const config = { getOrThrow: jest.fn().mockReturnValue('https://miramono.example') };
  const service = new SitemapService(
    articles as unknown as Repository<Article>,
    gallery as unknown as Repository<GalleryCase>,
    config as unknown as ConfigService,
  );

  it('renders a urlset with static, article and gallery entries', async () => {
    const xml = await service.buildSitemap();
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(xml).toContain('<loc>https://miramono.example/</loc>');
    expect(xml).toContain('<loc>https://miramono.example/blog/care</loc>');
    expect(xml).toContain('<loc>https://miramono.example/gallery/g-1</loc>');
  });

  it('builds a robots.txt that points at the sitemap', () => {
    const robots = service.buildRobots();
    expect(robots).toContain('User-agent: *');
    expect(robots).toContain('Disallow: /api/');
    expect(robots).toContain('Sitemap: https://miramono.example/sitemap.xml');
  });
});
