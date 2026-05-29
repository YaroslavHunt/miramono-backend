import { IsBoolean, IsOptional } from 'class-validator';

import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { ToOptionalBoolean } from '../../../common/transformers/to-boolean';

export class DoctorQueryDto extends PaginationQueryDto {
  @IsOptional()
  @ToOptionalBoolean()
  @IsBoolean()
  isActive?: boolean;
}
