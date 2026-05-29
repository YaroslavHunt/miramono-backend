import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  @Matches(/^[a-zA-Z0-9._-]+$/, {
    message: 'login may contain only latin letters, digits and . _ -',
  })
  login: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName: string;

  @IsString()
  @Matches(/^\+?[0-9\s()-]{7,20}$/, { message: 'phone must be a valid phone number' })
  phone: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;
}
