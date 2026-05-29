import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginatedResult } from '../../common/dto/paginated-result';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { User, UserRole } from '../users/entities/user.entity';
import { AppointmentsService } from './appointments.service';
import { AppointmentQueryDto } from './dto/appointment-query.dto';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto';
import { Appointment } from './entities/appointment.entity';

@ApiTags('appointments')
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointments: AppointmentsService) {}

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @Post()
  create(@Body() dto: CreateAppointmentDto, @CurrentUser() user?: User): Promise<Appointment> {
    return this.appointments.create(dto, user?.id);
  }

  @ApiBearerAuth()
  @Get('me')
  listMine(
    @CurrentUser('id') patientId: string,
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResult<Appointment>> {
    return this.appointments.listMine(patientId, query);
  }

  @Roles(UserRole.Admin, UserRole.Doctor)
  @ApiBearerAuth()
  @Get()
  list(@Query() query: AppointmentQueryDto): Promise<PaginatedResult<Appointment>> {
    return this.appointments.list(query);
  }

  @Roles(UserRole.Admin, UserRole.Doctor)
  @ApiBearerAuth()
  @Get(':id')
  findOne(@Param('id') id: string): Promise<Appointment> {
    return this.appointments.getById(id);
  }

  @Roles(UserRole.Admin, UserRole.Doctor)
  @ApiBearerAuth()
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateAppointmentStatusDto,
  ): Promise<Appointment> {
    return this.appointments.updateStatus(id, dto.status);
  }
}
