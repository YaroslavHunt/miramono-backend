import { createHash, timingSafeEqual } from 'node:crypto';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface LiqpayCheckoutParams {
  amount: number;
  currency: string;
  description: string;
  orderId: string;
  serverUrl?: string;
  resultUrl?: string;
}

export interface LiqpayCheckout {
  data: string;
  signature: string;
}

export interface LiqpayCallbackData {
  status?: string;
  order_id?: string;
  amount?: number;
  currency?: string;
  [key: string]: unknown;
}

@Injectable()
export class LiqpayService {
  constructor(private readonly config: ConfigService) {}

  buildCheckout(params: LiqpayCheckoutParams): LiqpayCheckout {
    const payload: Record<string, unknown> = {
      public_key: this.config.getOrThrow<string>('liqpay.publicKey'),
      version: this.config.get<number>('liqpay.apiVersion') ?? 3,
      action: 'pay',
      amount: params.amount,
      currency: params.currency,
      description: params.description,
      order_id: params.orderId,
    };
    if (this.config.get<boolean>('liqpay.sandbox')) {
      payload.sandbox = '1';
    }
    if (params.serverUrl) {
      payload.server_url = params.serverUrl;
    }
    if (params.resultUrl) {
      payload.result_url = params.resultUrl;
    }

    const data = Buffer.from(JSON.stringify(payload)).toString('base64');
    return { data, signature: this.sign(data) };
  }

  sign(data: string): string {
    const privateKey = this.config.getOrThrow<string>('liqpay.privateKey');
    return createHash('sha1')
      .update(privateKey + data + privateKey)
      .digest('base64');
  }

  verify(data: string, signature: string): boolean {
    const expected = Buffer.from(this.sign(data));
    const received = Buffer.from(signature ?? '');
    return expected.length === received.length && timingSafeEqual(expected, received);
  }

  decode(data: string): LiqpayCallbackData {
    return JSON.parse(Buffer.from(data, 'base64').toString('utf8')) as LiqpayCallbackData;
  }
}
