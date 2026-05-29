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

import { PaginatedResult } from '../../common/dto/paginated-result';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { CreateServiceCategoryDto } from './dto/create-service-category.dto';
import { ServiceCategoryQueryDto } from './dto/service-category-query.dto';
import { UpdateServiceCategoryDto } from './dto/update-service-category.dto';
import { ServiceCategory } from './entities/service-category.entity';
import { ServiceCategoriesService } from './service-categories.service';

@ApiTags('service-categories')
@Controller('service-categories')
export class ServiceCategoriesController {
  constructor(private readonly categories: ServiceCategoriesService) {}

  @Public()
  @Get()
  list(@Query() query: ServiceCategoryQueryDto): Promise<PaginatedResult<ServiceCategory>> {
    return this.categories.list(query);
  }

  @Public()
  @Get(':idOrSlug')
  findOne(@Param('idOrSlug') idOrSlug: string): Promise<ServiceCategory> {
    return this.categories.findOne(idOrSlug);
  }

  @Roles(UserRole.Admin)
  @ApiBearerAuth()
  @Post()
  create(@Body() dto: CreateServiceCategoryDto): Promise<ServiceCategory> {
    return this.categories.create(dto);
  }

  @Roles(UserRole.Admin)
  @ApiBearerAuth()
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateServiceCategoryDto): Promise<ServiceCategory> {
    return this.categories.update(id, dto);
  }

  @Roles(UserRole.Admin)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.categories.remove(id);
  }
}
