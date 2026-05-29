import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Article } from '../blog/entities/article.entity';
import { GalleryCase } from '../gallery/entities/gallery-case.entity';
import { SeoController } from './seo.controller';
import { SitemapService } from './sitemap.service';

@Module({
  imports: [TypeOrmModule.forFeature([Article, GalleryCase])],
  controllers: [SeoController],
  providers: [SitemapService],
})
export class SeoModule {}
