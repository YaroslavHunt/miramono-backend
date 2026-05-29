import { Type } from 'class-transformer';
import { IsEmail, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class UpdateClinicInfoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  phone: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  address: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  workingHours: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  mapUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  instagramUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  facebookUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  telegramUrl?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  yearsExperience?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  happyPatients?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  specialistsCount?: number;
}
