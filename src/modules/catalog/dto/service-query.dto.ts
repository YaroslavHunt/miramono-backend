import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { ToOptionalBoolean } from '../../../common/transformers/to-boolean';

export class ServiceQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @ToOptionalBoolean()
  @IsBoolean()
  isActive?: boolean;
}
