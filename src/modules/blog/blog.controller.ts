import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginatedResult } from '../../common/dto/paginated-result';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { UserRole } from '../users/entities/user.entity';
import { BlogService } from './blog.service';
import { ArticleQueryDto } from './dto/article-query.dto';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { Article } from './entities/article.entity';

@ApiTags('articles')
@Controller('articles')
export class BlogController {
  constructor(private readonly blog: BlogService) {}

  @Public()
  @Get()
  listPublished(@Query() query: PaginationQueryDto): Promise<PaginatedResult<Article>> {
    return this.blog.listPublished(query);
  }

  @Roles(UserRole.Admin)
  @ApiBearerAuth()
  @Get('admin')
  list(@Query() query: ArticleQueryDto): Promise<PaginatedResult<Article>> {
    return this.blog.list(query);
  }

  @Roles(UserRole.Admin)
  @ApiBearerAuth()
  @Get('admin/:id')
  getOne(@Param('id') id: string): Promise<Article> {
    return this.blog.getById(id);
  }

  @Roles(UserRole.Admin)
  @ApiBearerAuth()
  @Post()
  create(@Body() dto: CreateArticleDto): Promise<Article> {
    return this.blog.create(dto);
  }

  @Roles(UserRole.Admin)
  @ApiBearerAuth()
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateArticleDto): Promise<Article> {
    return this.blog.update(id, dto);
  }

  @Roles(UserRole.Admin)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.blog.remove(id);
  }

  @Public()
  @Get(':slug')
  findOne(@Param('slug') slug: string): Promise<Article> {
    return this.blog.findPublishedBySlug(slug);
  }
}
