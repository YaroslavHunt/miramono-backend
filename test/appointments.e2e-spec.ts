import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';

const future = () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
const past = () => new Date(Date.now() - 60 * 60 * 1000).toISOString();

describe('Appointments & consultations (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let patientToken: string;
  let guestAppointmentId: string;

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
        login: `e2e_appt_${Date.now()}`,
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

  it('lets a guest book an appointment without a token', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/appointments')
      .send({ fullName: 'Гість Гостьович', phone: '+380501112233', preferredAt: future() });
    expect(response.status).toBe(201);
    expect(response.body.status).toBe('NEW');
    expect(response.body.patientId).toBeNull();
    guestAppointmentId = response.body.id;
  });

  it('rejects a preferred time in the past', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/appointments')
      .send({ fullName: 'Запізнілий', phone: '+380501112233', preferredAt: past() });
    expect(response.status).toBe(400);
  });

  it('binds the appointment to an authenticated patient and lists it under /me', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/appointments')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({ fullName: 'Test Patient', phone: '+380501234567', preferredAt: future() });
    expect(created.status).toBe(201);
    expect(created.body.patientId).toBeTruthy();

    const mine = await request(app.getHttpServer())
      .get('/api/appointments/me')
      .set('Authorization', `Bearer ${patientToken}`);
    expect(mine.status).toBe(200);
    expect(mine.body.total).toBeGreaterThanOrEqual(1);
  });

  it('requires authentication for /me', async () => {
    const response = await request(app.getHttpServer()).get('/api/appointments/me');
    expect(response.status).toBe(401);
  });

  it('forbids a patient from listing all appointments', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/appointments')
      .set('Authorization', `Bearer ${patientToken}`);
    expect(response.status).toBe(403);
  });

  it('lets an admin list appointments and filter by status', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/appointments?status=NEW')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(response.status).toBe(200);
    expect(response.body.total).toBeGreaterThanOrEqual(1);
    expect(response.body.items.every((item: { status: string }) => item.status === 'NEW')).toBe(
      true,
    );
  });

  it('lets an admin change an appointment status', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/appointments/${guestAppointmentId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'CONFIRMED' });
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('CONFIRMED');
  });

  it('forbids a patient from changing a status', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/appointments/${guestAppointmentId}/status`)
      .set('Authorization', `Bearer ${patientToken}`)
      .send({ status: 'COMPLETED' });
    expect(response.status).toBe(403);
  });

  it('accepts a public quick consultation request', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/consultation-requests')
      .send({ name: 'Марія', phone: '+380509998877', message: 'Хочу проконсультуватись' });
    expect(response.status).toBe(201);
    expect(response.body.status).toBe('NEW');
  });

  it('exposes consultation requests to admins only', async () => {
    const forbidden = await request(app.getHttpServer())
      .get('/api/consultation-requests')
      .set('Authorization', `Bearer ${patientToken}`);
    expect(forbidden.status).toBe(403);

    const allowed = await request(app.getHttpServer())
      .get('/api/consultation-requests')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(allowed.status).toBe(200);
    expect(allowed.body.total).toBeGreaterThanOrEqual(1);
  });
});
