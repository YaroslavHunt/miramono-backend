import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';

describe('Auth (e2e)', () => {
  let app: INestApplication;

  const login = `patient_${Date.now()}`;
  const password = 'secret123';
  const credentials = {
    login,
    password,
    firstName: 'Test',
    lastName: 'Patient',
    phone: '+380501234567',
  };

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
  });

  afterAll(async () => {
    await app.close();
  });

  it('registers a patient and returns a token pair without secrets', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(credentials);

    expect(response.status).toBe(201);
    expect(response.body.accessToken).toEqual(expect.any(String));
    expect(response.body.refreshToken).toEqual(expect.any(String));
    expect(response.body.user.login).toBe(login);
    expect(response.body.user.role).toBe('PATIENT');
    expect(response.body.user.passwordHash).toBeUndefined();
    expect(response.body.user.hashedRefreshToken).toBeUndefined();
  });

  it('rejects a duplicate login', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(credentials);
    expect(response.status).toBe(409);
  });

  it('rejects an invalid registration payload', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ login: 'x', password: 'short' });
    expect(response.status).toBe(400);
  });

  it('rejects /api/users/me without a token', async () => {
    const response = await request(app.getHttpServer()).get('/api/users/me');
    expect(response.status).toBe(401);
  });

  it('runs the login → me → update → refresh flow', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ login, password });
    expect(loginResponse.status).toBe(200);
    const { accessToken, refreshToken } = loginResponse.body as {
      accessToken: string;
      refreshToken: string;
    };

    const meResponse = await request(app.getHttpServer())
      .get('/api/users/me')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(meResponse.status).toBe(200);
    expect(meResponse.body.login).toBe(login);
    expect(meResponse.body.passwordHash).toBeUndefined();

    const updateResponse = await request(app.getHttpServer())
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ firstName: 'Updated' });
    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.firstName).toBe('Updated');

    const refreshResponse = await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .set('Authorization', `Bearer ${refreshToken}`);
    expect(refreshResponse.status).toBe(200);
    expect(refreshResponse.body.accessToken).toEqual(expect.any(String));
    expect(refreshResponse.body.refreshToken).toEqual(expect.any(String));
  });

  it('forbids the wrong credentials at login', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ login, password: 'wrong-password' });
    expect(response.status).toBe(401);
  });
});
