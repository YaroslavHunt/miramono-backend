import { resolve } from 'node:path';

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';

const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
);

describe('Content engagement & uploads (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let patientToken: string;

  const slug = `e2e-article-${Date.now()}`;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication<NestExpressApplication>();
    app.setGlobalPrefix('api', { exclude: ['health'] });
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    (app as NestExpressApplication).useStaticAssets(resolve(process.env.UPLOAD_DIR ?? 'uploads'), {
      prefix: '/uploads',
    });
    await app.init();

    const adminLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ login: process.env.ADMIN_LOGIN, password: process.env.ADMIN_PASSWORD });
    adminToken = adminLogin.body.accessToken;

    const patient = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        login: `e2e_content_${Date.now()}`,
        password: 'secret123',
        firstName: 'Test',
        lastName: 'Patient',
        phone: '+380501234567',
      });
    patientToken = patient.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('articles', () => {
    let articleId: string;

    it('keeps a draft out of the public feed and exposes it once published', async () => {
      const created = await request(app.getHttpServer())
        .post('/api/articles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Догляд за зубами', slug, content: 'Повний текст статті.' });
      expect(created.status).toBe(201);
      expect(created.body.status).toBe('DRAFT');
      expect(created.body.publishedAt).toBeNull();
      articleId = created.body.id;

      const draftPublic = await request(app.getHttpServer()).get(`/api/articles/${slug}`);
      expect(draftPublic.status).toBe(404);

      const published = await request(app.getHttpServer())
        .patch(`/api/articles/${articleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'PUBLISHED' });
      expect(published.status).toBe(200);
      expect(published.body.publishedAt).not.toBeNull();

      const bySlug = await request(app.getHttpServer()).get(`/api/articles/${slug}`);
      expect(bySlug.status).toBe(200);
      expect(bySlug.body.id).toBe(articleId);

      const list = await request(app.getHttpServer()).get('/api/articles');
      expect(list.status).toBe(200);
      expect(list.body.items.some((a: { id: string }) => a.id === articleId)).toBe(true);
    });

    it('rejects a duplicate slug', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/articles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Dup', slug, content: 'x' });
      expect(response.status).toBe(409);
    });

    it('serves the admin feed with drafts behind a guard', async () => {
      const noToken = await request(app.getHttpServer()).get('/api/articles/admin');
      expect(noToken.status).toBe(401);

      const asPatient = await request(app.getHttpServer())
        .get('/api/articles/admin')
        .set('Authorization', `Bearer ${patientToken}`);
      expect(asPatient.status).toBe(403);

      const asAdmin = await request(app.getHttpServer())
        .get('/api/articles/admin?status=DRAFT')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(asAdmin.status).toBe(200);
    });

    it('forbids a patient from creating an article', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/articles')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({ title: 'Hidden', slug: `${slug}-2`, content: 'x' });
      expect(response.status).toBe(403);
    });
  });

  describe('reviews', () => {
    let reviewId: string;

    it('queues a guest review and hides it until moderated', async () => {
      const created = await request(app.getHttpServer())
        .post('/api/reviews')
        .send({ authorName: 'Марія', rating: 5, text: 'Найкраща клініка!' });
      expect(created.status).toBe(201);
      expect(created.body.isPublished).toBe(false);
      reviewId = created.body.id;

      const publicList = await request(app.getHttpServer()).get('/api/reviews');
      expect(publicList.status).toBe(200);
      expect(publicList.body.items.some((r: { id: string }) => r.id === reviewId)).toBe(false);

      const adminList = await request(app.getHttpServer())
        .get('/api/reviews/admin?isPublished=false')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(adminList.status).toBe(200);
      expect(adminList.body.items.some((r: { id: string }) => r.id === reviewId)).toBe(true);
    });

    it('rejects an out-of-range rating', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/reviews')
        .send({ authorName: 'Bad', rating: 9, text: 'x' });
      expect(response.status).toBe(400);
    });

    it('publishes a review through moderation, then makes it public', async () => {
      const moderated = await request(app.getHttpServer())
        .patch(`/api/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isPublished: true });
      expect(moderated.status).toBe(200);
      expect(moderated.body.isPublished).toBe(true);

      const publicList = await request(app.getHttpServer()).get('/api/reviews');
      expect(publicList.body.items.some((r: { id: string }) => r.id === reviewId)).toBe(true);
    });
  });

  describe('gallery', () => {
    let caseId: string;

    it('publishes a before/after case and reads it publicly', async () => {
      const created = await request(app.getHttpServer())
        .post('/api/gallery')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Реставрація',
          beforeImageUrl: '/uploads/before.png',
          afterImageUrl: '/uploads/after.png',
        });
      expect(created.status).toBe(201);
      expect(created.body.isPublished).toBe(true);
      caseId = created.body.id;

      const publicCase = await request(app.getHttpServer()).get(`/api/gallery/${caseId}`);
      expect(publicCase.status).toBe(200);
      expect(publicCase.body.beforeImageUrl).toBe('/uploads/before.png');
    });

    it('hides an unpublished case from the public read', async () => {
      const hidden = await request(app.getHttpServer())
        .patch(`/api/gallery/${caseId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isPublished: false });
      expect(hidden.status).toBe(200);

      const publicCase = await request(app.getHttpServer()).get(`/api/gallery/${caseId}`);
      expect(publicCase.status).toBe(404);
    });

    it('rejects a case pointing at an unknown doctor', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/gallery')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          beforeImageUrl: '/uploads/b.png',
          afterImageUrl: '/uploads/a.png',
          doctorId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        });
      expect(response.status).toBe(404);
    });
  });

  describe('uploads', () => {
    it('stores an image and serves it back as a static asset', async () => {
      const uploaded = await request(app.getHttpServer())
        .post('/api/uploads')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('file', PNG_1X1, { filename: 'photo.png', contentType: 'image/png' });
      expect(uploaded.status).toBe(201);
      expect(uploaded.body.url).toMatch(/^\/uploads\/[0-9a-f-]+\.png$/);
      expect(uploaded.body.mimeType).toBe('image/png');

      const served = await request(app.getHttpServer()).get(uploaded.body.url);
      expect(served.status).toBe(200);
      expect(served.headers['content-type']).toContain('image/png');
    });

    it('rejects a non-image file type', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/uploads')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('file', Buffer.from('plain text'), {
          filename: 'note.txt',
          contentType: 'text/plain',
        });
      expect(response.status).toBe(400);
    });

    it('rejects a file over the size limit', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/uploads')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('file', Buffer.alloc(6 * 1024 * 1024), {
          filename: 'big.png',
          contentType: 'image/png',
        });
      expect(response.status).toBe(400);
    });

    it('requires a file in the request', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/uploads')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(400);
    });

    it('requires admin rights', async () => {
      const noToken = await request(app.getHttpServer())
        .post('/api/uploads')
        .attach('file', PNG_1X1, { filename: 'photo.png', contentType: 'image/png' });
      expect(noToken.status).toBe(401);

      const asPatient = await request(app.getHttpServer())
        .post('/api/uploads')
        .set('Authorization', `Bearer ${patientToken}`)
        .attach('file', PNG_1X1, { filename: 'photo.png', contentType: 'image/png' });
      expect(asPatient.status).toBe(403);
    });
  });
});
