import { IsEnum, IsOptional } from 'class-validator';

import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { ConsultationStatus } from '../entities/consultation-request.entity';

export class ConsultationRequestQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(ConsultationStatus)
  status?: ConsultationStatus;
}
