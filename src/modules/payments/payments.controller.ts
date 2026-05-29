import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';

import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginatedResult } from '../../common/dto/paginated-result';
import { UserRole } from '../users/entities/user.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { LiqpayCallbackDto } from './dto/liqpay-callback.dto';
import { PaymentQueryDto } from './dto/payment-query.dto';
import { Payment } from './entities/payment.entity';
import { CallbackResult, PaymentCheckout, PaymentsService } from './payments.service';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Public()
  @Post()
  create(@Body() dto: CreatePaymentDto): Promise<PaymentCheckout> {
    return this.payments.create(dto);
  }

  @Public()
  @SkipThrottle()
  @HttpCode(HttpStatus.OK)
  @Post('liqpay-callback')
  callback(@Body() dto: LiqpayCallbackDto): Promise<CallbackResult> {
    return this.payments.handleCallback(dto.data, dto.signature);
  }

  @Roles(UserRole.Admin)
  @ApiBearerAuth()
  @Get('admin')
  list(@Query() query: PaymentQueryDto): Promise<PaginatedResult<Payment>> {
    return this.payments.list(query);
  }

  @Roles(UserRole.Admin)
  @ApiBearerAuth()
  @Get('admin/:id')
  getOne(@Param('id') id: string): Promise<Payment> {
    return this.payments.getById(id);
  }
}
