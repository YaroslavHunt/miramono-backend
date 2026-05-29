import { IsEnum, IsOptional } from 'class-validator';

import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { ArticleStatus } from '../entities/article.entity';

export class ArticleQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(ArticleStatus)
  status?: ArticleStatus;
}
