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
import { UserRole } from '../users/entities/user.entity';
import { CreateGalleryCaseDto } from './dto/create-gallery-case.dto';
import { GalleryCaseQueryDto } from './dto/gallery-case-query.dto';
import { UpdateGalleryCaseDto } from './dto/update-gallery-case.dto';
import { GalleryCase } from './entities/gallery-case.entity';
import { GalleryService } from './gallery.service';

@ApiTags('gallery')
@Controller('gallery')
export class GalleryController {
  constructor(private readonly gallery: GalleryService) {}

  @Public()
  @Get()
  listPublished(@Query() query: GalleryCaseQueryDto): Promise<PaginatedResult<GalleryCase>> {
    return this.gallery.listPublished(query);
  }

  @Roles(UserRole.Admin)
  @ApiBearerAuth()
  @Get('admin')
  list(@Query() query: GalleryCaseQueryDto): Promise<PaginatedResult<GalleryCase>> {
    return this.gallery.list(query);
  }

  @Roles(UserRole.Admin)
  @ApiBearerAuth()
  @Get('admin/:id')
  getOne(@Param('id') id: string): Promise<GalleryCase> {
    return this.gallery.getById(id);
  }

  @Roles(UserRole.Admin)
  @ApiBearerAuth()
  @Post()
  create(@Body() dto: CreateGalleryCaseDto): Promise<GalleryCase> {
    return this.gallery.create(dto);
  }

  @Roles(UserRole.Admin)
  @ApiBearerAuth()
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateGalleryCaseDto): Promise<GalleryCase> {
    return this.gallery.update(id, dto);
  }

  @Roles(UserRole.Admin)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.gallery.remove(id);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string): Promise<GalleryCase> {
    return this.gallery.findPublished(id);
  }
}
