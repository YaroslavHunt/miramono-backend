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
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { DoctorQueryDto } from './dto/doctor-query.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { Doctor } from './entities/doctor.entity';
import { DoctorsService } from './doctors.service';

@ApiTags('doctors')
@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctors: DoctorsService) {}

  @Public()
  @Get()
  list(@Query() query: DoctorQueryDto): Promise<PaginatedResult<Doctor>> {
    return this.doctors.list(query);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string): Promise<Doctor> {
    return this.doctors.getById(id);
  }

  @Roles(UserRole.Admin)
  @ApiBearerAuth()
  @Post()
  create(@Body() dto: CreateDoctorDto): Promise<Doctor> {
    return this.doctors.create(dto);
  }

  @Roles(UserRole.Admin)
  @ApiBearerAuth()
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDoctorDto): Promise<Doctor> {
    return this.doctors.update(id, dto);
  }

  @Roles(UserRole.Admin)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.doctors.remove(id);
  }
}
