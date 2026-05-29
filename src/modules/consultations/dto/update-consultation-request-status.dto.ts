import { IsEnum } from 'class-validator';

import { ConsultationStatus } from '../entities/consultation-request.entity';

export class UpdateConsultationRequestStatusDto {
  @IsEnum(ConsultationStatus)
  status: ConsultationStatus;
}
