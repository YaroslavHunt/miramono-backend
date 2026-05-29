import { IsNotEmpty, IsString } from 'class-validator';

export class LiqpayCallbackDto {
  @IsString()
  @IsNotEmpty()
  data: string;

  @IsString()
  @IsNotEmpty()
  signature: string;
}
