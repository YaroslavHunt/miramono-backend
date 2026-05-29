import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Appointment } from '../appointments/entities/appointment.entity';
import { Payment } from './entities/payment.entity';
import { LiqpayService } from './liqpay.service';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, Appointment])],
  controllers: [PaymentsController],
  providers: [PaymentsService, LiqpayService],
})
export class PaymentsModule {}
