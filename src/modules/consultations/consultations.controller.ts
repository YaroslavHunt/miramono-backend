import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginatedResult } from '../../common/dto/paginated-result';
import { UserRole } from '../users/entities/user.entity';
import { ConsultationsService } from './consultations.service';
import { ConsultationRequestQueryDto } from './dto/consultation-request-query.dto';
import { CreateConsultationRequestDto } from './dto/create-consultation-request.dto';
import { UpdateConsultationRequestStatusDto } from './dto/update-consultation-request-status.dto';
import { ConsultationRequest } from './entities/consultation-request.entity';

@ApiTags('consultation-requests')
@Controller('consultation-requests')
export class ConsultationsController {
  constructor(private readonly consultations: ConsultationsService) {}

  @Public()
  @Post()
  create(@Body() dto: CreateConsultationRequestDto): Promise<ConsultationRequest> {
    return this.consultations.create(dto);
  }

  @Roles(UserRole.Admin)
  @ApiBearerAuth()
  @Get()
  list(@Query() query: ConsultationRequestQueryDto): Promise<PaginatedResult<ConsultationRequest>> {
    return this.consultations.list(query);
  }

  @Roles(UserRole.Admin)
  @ApiBearerAuth()
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateConsultationRequestStatusDto,
  ): Promise<ConsultationRequest> {
    return this.consultations.updateStatus(id, dto.status);
  }
}
