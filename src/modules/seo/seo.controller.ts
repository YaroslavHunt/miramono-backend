import { Controller, Get, Header } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { Public } from '../../common/decorators/public.decorator';
import { SitemapService } from './sitemap.service';

@ApiTags('seo')
@Controller()
export class SeoController {
  constructor(private readonly sitemaps: SitemapService) {}

  @Public()
  @Get('sitemap.xml')
  @Header('Content-Type', 'application/xml; charset=utf-8')
  sitemap(): Promise<string> {
    return this.sitemaps.buildSitemap();
  }

  @Public()
  @Get('robots.txt')
  @Header('Content-Type', 'text/plain; charset=utf-8')
  robots(): string {
    return this.sitemaps.buildRobots();
  }
}
