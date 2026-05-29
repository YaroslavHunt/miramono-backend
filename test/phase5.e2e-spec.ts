import { createHash } from 'node:crypto';

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';

function liqpaySignature(data: string): string {
  const key = process.env.LIQPAY_PRIVATE_KEY ?? '';
  return createHash('sha1')
    .update(key + data + key)
    .digest('base64');
}

describe('Payments, SEO, i18n & caching (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;

  const tag = Date.now();

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api', { exclude: ['health', 'sitemap.xml', 'robots.txt'] });
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();

    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ login: process.env.ADMIN_LOGIN, password: process.env.ADMIN_PASSWORD });
    adminToken = login.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('payments (LiqPay)', () => {
    let paymentId: string;
    let orderId: string;

    it('creates a payment and returns the signed checkout payload', async () => {
      const created = await request(app.getHttpServer())
        .post('/api/payments')
        .send({ amount: 1500.5, description: 'Оплата консультації' });
      expect(created.status).toBe(201);
      expect(created.body.data).toBeTruthy();
      expect(created.body.signature).toBe(liqpaySignature(created.body.data));
      expect(created.body.checkoutUrl).toContain('liqpay');
      paymentId = created.body.paymentId;
      orderId = created.body.orderId;
    });

    it('updates the payment status on a callback with a valid signature', async () => {
      const data = Buffer.from(JSON.stringify({ order_id: orderId, status: 'success' })).toString(
        'base64',
      );
      const ok = await request(app.getHttpServer())
        .post('/api/payments/liqpay-callback')
        .send({ data, signature: liqpaySignature(data) });
      expect(ok.status).toBe(200);
      expect(ok.body.status).toBe('SUCCESS');

      const fetched = await request(app.getHttpServer())
        .get(`/api/payments/admin/${paymentId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(fetched.status).toBe(200);
      expect(fetched.body.status).toBe('SUCCESS');
    });

    it('rejects a callback with an invalid signature', async () => {
      const data = Buffer.from(JSON.stringify({ order_id: orderId, status: 'failure' })).toString(
        'base64',
      );
      const response = await request(app.getHttpServer())
        .post('/api/payments/liqpay-callback')
        .send({ data, signature: 'forged-signature' });
      expect(response.status).toBe(400);
    });
  });

  describe('SEO', () => {
    it('serves sitemap.xml as application/xml', async () => {
      const response = await request(app.getHttpServer()).get('/sitemap.xml');
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('application/xml');
      expect(response.text).toContain('<urlset');
    });

    it('serves robots.txt as text/plain pointing at the sitemap', async () => {
      const response = await request(app.getHttpServer()).get('/robots.txt');
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/plain');
      expect(response.text).toContain('Sitemap:');
    });
  });

  describe('i18n', () => {
    it('localizes the not-found message via ?lang', async () => {
      const uk = await request(app.getHttpServer()).get(`/api/articles/missing-${tag}`);
      expect(uk.status).toBe(404);
      expect(uk.body.message).toBe('Статтю не знайдено');

      const en = await request(app.getHttpServer()).get(`/api/articles/missing-${tag}?lang=en`);
      expect(en.status).toBe(404);
      expect(en.body.message).toBe('Article not found');
    });

    it('returns the english translation of an article when requested', async () => {
      const slug = `i18n-article-${tag}`;
      const created = await request(app.getHttpServer())
        .post('/api/articles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Український заголовок',
          slug,
          content: 'Український текст статті.',
          status: 'PUBLISHED',
          translations: { en: { title: 'English title', content: 'English article body.' } },
        });
      expect(created.status).toBe(201);

      const uk = await request(app.getHttpServer()).get(`/api/articles/${slug}`);
      expect(uk.body.title).toBe('Український заголовок');

      const en = await request(app.getHttpServer()).get(`/api/articles/${slug}?lang=en`);
      expect(en.body.title).toBe('English title');
      expect(en.body.content).toBe('English article body.');
      // the raw translations blob must not leak into the public response
      expect(en.body.translations ?? null).toBeNull();
      expect(uk.body.translations ?? null).toBeNull();
    });
  });

  describe('caching invalidation', () => {
    it('reflects a freshly created service in the cached public list', async () => {
      const categories = await request(app.getHttpServer()).get('/api/service-categories');
      const categoryId = categories.body.items[0].id;

      // prime the public cache
      await request(app.getHttpServer()).get('/api/services?limit=100');

      const name = `Кеш-послуга ${tag}`;
      const created = await request(app.getHttpServer())
        .post('/api/services')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name, price: 777, categoryId });
      expect(created.status).toBe(201);

      const list = await request(app.getHttpServer()).get('/api/services?limit=100');
      expect(list.body.items.some((s: { id: string }) => s.id === created.body.id)).toBe(true);
    });
  });
});
