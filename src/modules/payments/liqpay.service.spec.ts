import { ConfigService } from '@nestjs/config';

import { LiqpayService } from './liqpay.service';

describe('LiqpayService', () => {
  const config = {
    get: jest.fn((key: string) => {
      const values: Record<string, unknown> = {
        'liqpay.apiVersion': 3,
        'liqpay.sandbox': true,
      };
      return values[key];
    }),
    getOrThrow: jest.fn((key: string) => {
      const values: Record<string, string> = {
        'liqpay.publicKey': 'sandbox_i00000000000',
        'liqpay.privateKey': 'sandbox_private_key',
      };
      return values[key];
    }),
  };
  const service = new LiqpayService(config as unknown as ConfigService);

  it('builds a base64 data payload and a matching signature', () => {
    const checkout = service.buildCheckout({
      amount: 1200,
      currency: 'UAH',
      description: 'Консультація',
      orderId: 'order-1',
      serverUrl: 'https://example.com/api/payments/liqpay-callback',
    });

    const decoded = service.decode(checkout.data);
    expect(decoded.order_id).toBe('order-1');
    expect(decoded.amount).toBe(1200);
    expect(decoded).toMatchObject({
      public_key: 'sandbox_i00000000000',
      action: 'pay',
      sandbox: '1',
    });
    expect(checkout.signature).toBe(service.sign(checkout.data));
  });

  it('verifies a valid signature and rejects a tampered one', () => {
    const checkout = service.buildCheckout({
      amount: 500,
      currency: 'UAH',
      description: 'Гігієна',
      orderId: 'order-2',
    });

    expect(service.verify(checkout.data, checkout.signature)).toBe(true);
    expect(service.verify(checkout.data, 'not-the-signature')).toBe(false);

    const tampered = service.decode(checkout.data);
    tampered.amount = 1;
    const tamperedData = Buffer.from(JSON.stringify(tampered)).toString('base64');
    expect(service.verify(tamperedData, checkout.signature)).toBe(false);
  });
});
