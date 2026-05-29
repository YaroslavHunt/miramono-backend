import { Type } from 'class-transformer';
import { IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';

export class ArticleTranslationDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  excerpt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50000)
  content?: string;
}

export class ArticleTranslationsDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => ArticleTranslationDto)
  en?: ArticleTranslationDto;
}
