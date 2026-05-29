import { plainToInstance, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  validateSync,
} from 'class-validator';

export enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Development;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(65535)
  PORT: number = 3000;

  @IsString()
  @IsNotEmpty()
  DB_HOST: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(65535)
  DB_PORT: number;

  @IsString()
  @IsNotEmpty()
  DB_USERNAME: string;

  @IsString()
  @IsNotEmpty()
  DB_PASSWORD: string;

  @IsString()
  @IsNotEmpty()
  DB_NAME: string;

  @IsString()
  @IsNotEmpty()
  REDIS_HOST: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(65535)
  REDIS_PORT: number;

  @IsString()
  @IsOptional()
  CORS_ORIGINS?: string;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  THROTTLE_TTL?: number;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  THROTTLE_LIMIT?: number;

  @IsString()
  @IsNotEmpty()
  JWT_ACCESS_SECRET: string;

  @IsString()
  @IsOptional()
  JWT_ACCESS_TTL?: string;

  @IsString()
  @IsNotEmpty()
  JWT_REFRESH_SECRET: string;

  @IsString()
  @IsOptional()
  JWT_REFRESH_TTL?: string;

  @IsString()
  @IsNotEmpty()
  ADMIN_LOGIN: string;

  @IsString()
  @IsNotEmpty()
  ADMIN_PASSWORD: string;

  @IsString()
  @IsOptional()
  UPLOAD_DIR?: string;

  @IsString()
  @IsNotEmpty()
  LIQPAY_PUBLIC_KEY: string;

  @IsString()
  @IsNotEmpty()
  LIQPAY_PRIVATE_KEY: string;

  @IsString()
  @IsOptional()
  LIQPAY_SANDBOX?: string;

  @IsString()
  @IsOptional()
  PUBLIC_SITE_URL?: string;

  @IsString()
  @IsOptional()
  DEFAULT_LOCALE?: string;
}

export function validate(config: Record<string, unknown>): EnvironmentVariables {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length > 0) {
    throw new Error(errors.map((e) => Object.values(e.constraints ?? {})).join('; '));
  }

  return validated;
}
