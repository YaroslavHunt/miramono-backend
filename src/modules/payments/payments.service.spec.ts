import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { I18nService } from 'nestjs-i18n';
import { Repository } from 'typeorm';

import { Appointment } from '../appointments/entities/appointment.entity';
import { Payment, PaymentStatus } from './entities/payment.entity';
import { LiqpayService } from './liqpay.service';
import { PaymentsService } from './payments.service';

describe('PaymentsService', () => {
  let payments: {
    create: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
    findAndCount: jest.Mock;
  };
  let appointments: { exists: jest.Mock };
  let liqpay: { buildCheckout: jest.Mock; verify: jest.Mock; decode: jest.Mock };
  let config: { get: jest.Mock; getOrThrow: jest.Mock };
  let service: PaymentsService;

  beforeEach(() => {
    payments = {
      create: jest.fn((data: Partial<Payment>) => data as Payment),
      save: jest.fn((entity: Partial<Payment>) =>
        Promise.resolve({ id: 'p1', ...entity } as Payment),
      ),
      findOne: jest.fn(),
      findAndCount: jest.fn().mockResolvedValue([[], 0]),
    };
    appointments = { exists: jest.fn().mockResolvedValue(true) };
    liqpay = {
      buildCheckout: jest.fn().mockReturnValue({ data: 'ZGF0YQ==', signature: 'sig' }),
      verify: jest.fn(),
      decode: jest.fn(),
    };
    config = {
      get: jest.fn().mockReturnValue('https://example.com'),
      getOrThrow: jest.fn().mockReturnValue('https://www.liqpay.ua/api/3/checkout'),
    };
    const i18n = { translate: jest.fn((key: string) => key) };
    service = new PaymentsService(
      payments as unknown as Repository<Payment>,
      appointments as unknown as Repository<Appointment>,
      liqpay as unknown as LiqpayService,
      config as unknown as ConfigService,
      i18n as unknown as I18nService,
    );
  });

  describe('create', () => {
    it('persists a pending payment and returns the signed checkout', async () => {
      const result = await service.create({ amount: 1200, description: 'Консультація' });

      expect(payments.save).toHaveBeenCalledTimes(1);
      const saved = payments.save.mock.calls[0][0] as Payment;
      expect(saved.status).toBe(PaymentStatus.Pending);
      expect(saved.currency).toBe('UAH');
      expect(result).toMatchObject({ paymentId: 'p1', data: 'ZGF0YQ==', signature: 'sig' });
      expect(result.orderId).toBe(saved.liqpayOrderId);
    });

    it('rejects an unknown appointment', async () => {
      appointments.exists.mockResolvedValue(false);
      await expect(
        service.create({ amount: 100, description: 'x', appointmentId: 'missing' }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(payments.save).not.toHaveBeenCalled();
    });
  });

  describe('handleCallback', () => {
    it('rejects an invalid signature', async () => {
      liqpay.verify.mockReturnValue(false);
      await expect(service.handleCallback('data', 'bad')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('marks the payment successful on a success status', async () => {
      liqpay.verify.mockReturnValue(true);
      liqpay.decode.mockReturnValue({ order_id: 'order-1', status: 'success' });
      const payment = { liqpayOrderId: 'order-1', status: PaymentStatus.Pending } as Payment;
      payments.findOne.mockResolvedValue(payment);

      const result = await service.handleCallback('data', 'sig');

      expect(result.status).toBe(PaymentStatus.Success);
      expect(payments.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: PaymentStatus.Success }),
      );
    });

    it('maps a failure status and ignores unknown orders', async () => {
      liqpay.verify.mockReturnValue(true);
      liqpay.decode.mockReturnValue({ order_id: 'order-1', status: 'failure' });
      payments.findOne.mockResolvedValue({
        liqpayOrderId: 'order-1',
        status: PaymentStatus.Pending,
      });
      expect((await service.handleCallback('data', 'sig')).status).toBe(PaymentStatus.Failure);

      payments.findOne.mockResolvedValue(null);
      expect((await service.handleCallback('data', 'sig')).status).toBe('IGNORED');
    });

    it('returns 400 on a malformed (unparseable) payload', async () => {
      liqpay.verify.mockReturnValue(true);
      liqpay.decode.mockImplementation(() => {
        throw new SyntaxError('Unexpected token');
      });
      await expect(service.handleCallback('garbage', 'sig')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('does not overwrite an already finalized payment', async () => {
      liqpay.verify.mockReturnValue(true);
      liqpay.decode.mockReturnValue({ order_id: 'order-1', status: 'failure' });
      payments.findOne.mockResolvedValue({
        liqpayOrderId: 'order-1',
        status: PaymentStatus.Success,
      });

      const result = await service.handleCallback('data', 'sig');

      expect(result.status).toBe(PaymentStatus.Success);
      expect(payments.save).not.toHaveBeenCalled();
    });
  });
});
