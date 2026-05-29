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
import { CreateServiceDto } from './dto/create-service.dto';
import { ServiceQueryDto } from './dto/service-query.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { Service } from './entities/service.entity';
import { ServicesService } from './services.service';

@ApiTags('services')
@Controller('services')
export class ServicesController {
  constructor(private readonly services: ServicesService) {}

  @Public()
  @Get()
  list(@Query() query: ServiceQueryDto): Promise<PaginatedResult<Service>> {
    return this.services.list(query);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string): Promise<Service> {
    return this.services.getById(id);
  }

  @Roles(UserRole.Admin)
  @ApiBearerAuth()
  @Post()
  create(@Body() dto: CreateServiceDto): Promise<Service> {
    return this.services.create(dto);
  }

  @Roles(UserRole.Admin)
  @ApiBearerAuth()
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateServiceDto): Promise<Service> {
    return this.services.update(id, dto);
  }

  @Roles(UserRole.Admin)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.services.remove(id);
  }
}
