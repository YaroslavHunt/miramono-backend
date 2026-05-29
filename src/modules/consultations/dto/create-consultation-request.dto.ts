import { IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class CreateConsultationRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  name: string;

  @IsString()
  @Matches(/^\+?[0-9\s()-]{7,20}$/, { message: 'phone must be a valid phone number' })
  phone: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  message?: string;
}
