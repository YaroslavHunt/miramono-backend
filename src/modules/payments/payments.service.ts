import { randomUUID } from 'node:crypto';

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { FindOptionsWhere, Repository } from 'typeorm';

import { PaginatedResult, paginated } from '../../common/dto/paginated-result';
import { Appointment } from '../appointments/entities/appointment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentQueryDto } from './dto/payment-query.dto';
import { Payment, PaymentStatus } from './entities/payment.entity';
import { LiqpayCallbackData, LiqpayService } from './liqpay.service';

export interface PaymentCheckout {
  paymentId: string;
  orderId: string;
  checkoutUrl: string;
  data: string;
  signature: string;
}

export interface CallbackResult {
  status: PaymentStatus | 'IGNORED';
}

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly payments: Repository<Payment>,
    @InjectRepository(Appointment)
    private readonly appointments: Repository<Appointment>,
    private readonly liqpay: LiqpayService,
    private readonly config: ConfigService,
    private readonly i18n: I18nService,
  ) {}

  async create(dto: CreatePaymentDto): Promise<PaymentCheckout> {
    if (dto.appointmentId) {
      const exists = await this.appointments.exists({ where: { id: dto.appointmentId } });
      if (!exists) {
        throw new NotFoundException(this.i18n.translate('errors.appointment_not_found'));
      }
    }

    const orderId = randomUUID();
    const currency = dto.currency ?? 'UAH';
    const payment = await this.payments.save(
      this.payments.create({
        liqpayOrderId: orderId,
        amount: dto.amount,
        currency,
        description: dto.description,
        appointmentId: dto.appointmentId ?? null,
        status: PaymentStatus.Pending,
      }),
    );

    const siteUrl = this.config.get<string>('seo.siteUrl');
    const checkout = this.liqpay.buildCheckout({
      amount: dto.amount,
      currency,
      description: dto.description,
      orderId,
      serverUrl: siteUrl ? `${siteUrl}/api/payments/liqpay-callback` : undefined,
      resultUrl: siteUrl ?? undefined,
    });

    return {
      paymentId: payment.id,
      orderId,
      checkoutUrl: this.config.getOrThrow<string>('liqpay.checkoutUrl'),
      data: checkout.data,
      signature: checkout.signature,
    };
  }

  async handleCallback(data: string, signature: string): Promise<CallbackResult> {
    if (!this.liqpay.verify(data, signature)) {
      throw new BadRequestException(this.i18n.translate('errors.invalid_signature'));
    }

    let decoded: LiqpayCallbackData;
    try {
      decoded = this.liqpay.decode(data);
    } catch {
      throw new BadRequestException(this.i18n.translate('errors.malformed_callback'));
    }
    if (!decoded.order_id) {
      throw new BadRequestException(this.i18n.translate('errors.malformed_callback'));
    }

    const payment = await this.payments.findOne({ where: { liqpayOrderId: decoded.order_id } });
    if (!payment) {
      return { status: 'IGNORED' };
    }

    // a payment is finalized once; retries or out-of-order callbacks must not flip a terminal status
    if (payment.status !== PaymentStatus.Pending) {
      return { status: payment.status };
    }

    payment.status = this.mapStatus(decoded.status);
    await this.payments.save(payment);
    return { status: payment.status };
  }

  async list(query: PaymentQueryDto): Promise<PaginatedResult<Payment>> {
    const where: FindOptionsWhere<Payment> = {};
    if (query.status) {
      where.status = query.status;
    }

    const [items, total] = await this.payments.findAndCount({
      where,
      relations: { appointment: true },
      order: { createdAt: 'DESC' },
      skip: query.skip,
      take: query.limit,
    });
    return paginated(items, total, query);
  }

  async getById(id: string): Promise<Payment> {
    const payment = await this.payments.findOne({
      where: { id },
      relations: { appointment: true },
    });
    if (!payment) {
      throw new NotFoundException(this.i18n.translate('errors.payment_not_found'));
    }
    return payment;
  }

  private mapStatus(status?: string): PaymentStatus {
    switch (status) {
      case 'success':
      case 'sandbox':
        return PaymentStatus.Success;
      case 'failure':
      case 'error':
      case 'reversed':
        return PaymentStatus.Failure;
      default:
        return PaymentStatus.Pending;
    }
  }
}
