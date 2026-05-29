import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';

describe('Catalog, doctors & clinic (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let patientToken: string;
  let categoryId: string;
  let serviceId: string;

  const slug = `e2e-cat-${Date.now()}`;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api', { exclude: ['health'] });
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();

    const adminLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ login: process.env.ADMIN_LOGIN, password: process.env.ADMIN_PASSWORD });
    adminToken = adminLogin.body.accessToken;

    const patient = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        login: `e2e_patient_${Date.now()}`,
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

  it('exposes the seeded base treatment directions publicly', async () => {
    const response = await request(app.getHttpServer()).get('/api/service-categories');
    expect(response.status).toBe(200);
    expect(response.body.total).toBeGreaterThanOrEqual(4);
    expect(Array.isArray(response.body.items)).toBe(true);
    expect(response.body).toMatchObject({ page: 1, limit: 20 });
  });

  it('rejects category creation without a token', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/service-categories')
      .send({ name: 'Hidden', slug });
    expect(response.status).toBe(401);
  });

  it('forbids a patient from creating a category', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/service-categories')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({ name: 'Hidden', slug });
    expect(response.status).toBe(403);
  });

  it('lets an admin create a category and look it up by slug', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/service-categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'E2E напрям', slug, description: 'temp', sortOrder: 99 });
    expect(created.status).toBe(201);
    categoryId = created.body.id;

    const bySlug = await request(app.getHttpServer()).get(`/api/service-categories/${slug}`);
    expect(bySlug.status).toBe(200);
    expect(bySlug.body.id).toBe(categoryId);
  });

  it('rejects a duplicate slug', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/service-categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Dup', slug });
    expect(response.status).toBe(409);
  });

  it('creates a service and returns its price as a number with the category relation', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/services')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'E2E послуга', price: 1234.5, durationMinutes: 45, categoryId });
    expect(created.status).toBe(201);
    expect(created.body.price).toBe(1234.5);
    serviceId = created.body.id;

    const list = await request(app.getHttpServer()).get(`/api/services?categoryId=${categoryId}`);
    expect(list.status).toBe(200);
    expect(list.body.total).toBe(1);
    expect(list.body.items[0].category.id).toBe(categoryId);
    expect(list.body.items[0].price).toBe(1234.5);
  });

  it('validates the service payload', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/services')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Bad', price: -1, categoryId });
    expect(response.status).toBe(400);
  });

  it('rejects a service pointing at an unknown category', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/services')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Orphan', price: 10, categoryId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
    expect(response.status).toBe(404);
  });

  it('soft deletes a service and hides it from reads', async () => {
    const removed = await request(app.getHttpServer())
      .delete(`/api/services/${serviceId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(removed.status).toBe(204);

    const fetch = await request(app.getHttpServer()).get(`/api/services/${serviceId}`);
    expect(fetch.status).toBe(404);
  });

  it('manages doctors with admin-only writes', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/doctors')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ firstName: 'Олег', lastName: 'Коваль', specialization: 'Імплантолог' });
    expect(created.status).toBe(201);

    const list = await request(app.getHttpServer()).get('/api/doctors');
    expect(list.status).toBe(200);
    expect(list.body.total).toBeGreaterThanOrEqual(1);
  });

  it('upserts the clinic info singleton', async () => {
    const first = await request(app.getHttpServer())
      .put('/api/clinic-info')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        phone: '+380322000000',
        address: 'Львів',
        workingHours: 'Пн–Пт 9:00–19:00',
        happyPatients: 3000,
      });
    expect(first.status).toBe(200);
    const firstId = first.body.id;

    const second = await request(app.getHttpServer())
      .put('/api/clinic-info')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ phone: '+380322111111', address: 'Львів', workingHours: 'Пн–Нд 9:00–20:00' });
    expect(second.status).toBe(200);
    expect(second.body.id).toBe(firstId);

    const read = await request(app.getHttpServer()).get('/api/clinic-info');
    expect(read.status).toBe(200);
    expect(read.body.phone).toBe('+380322111111');
  });
});
