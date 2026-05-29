import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';

import { User, UserRole } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let users: jest.Mocked<
    Pick<
      UsersService,
      'create' | 'findByLoginWithSecrets' | 'findByIdWithRefreshToken' | 'setRefreshTokenHash'
    >
  >;
  let jwt: { signAsync: jest.Mock };
  let config: { get: jest.Mock; getOrThrow: jest.Mock };
  let service: AuthService;

  beforeEach(() => {
    users = {
      create: jest.fn(),
      findByLoginWithSecrets: jest.fn(),
      findByIdWithRefreshToken: jest.fn(),
      setRefreshTokenHash: jest.fn(),
    };
    jwt = { signAsync: jest.fn().mockResolvedValue('signed.token') };
    config = {
      get: jest.fn().mockReturnValue('15m'),
      getOrThrow: jest.fn().mockReturnValue('secret'),
    };
    service = new AuthService(
      users as unknown as UsersService,
      jwt as unknown as JwtService,
      config as unknown as ConfigService,
    );
  });

  it('registers a patient and issues a session', async () => {
    const user = { id: 'u1', login: 'john', role: UserRole.Patient } as User;
    users.create.mockResolvedValue(user);

    const result = await service.register({
      login: 'john',
      password: 'secret123',
      firstName: 'J',
      lastName: 'D',
      phone: '1234567',
    });

    expect(users.create).toHaveBeenCalledWith(expect.objectContaining({ role: UserRole.Patient }));
    expect(result.accessToken).toBe('signed.token');
    expect(result.user).toBe(user);
    expect(users.setRefreshTokenHash).toHaveBeenCalledWith(
      'u1',
      expect.stringMatching(/^\$argon2/),
    );
  });

  describe('login', () => {
    it('rejects an unknown login', async () => {
      users.findByLoginWithSecrets.mockResolvedValue(null);
      await expect(service.login({ login: 'x', password: 'y' })).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('rejects a wrong password', async () => {
      const passwordHash = await argon2.hash('correct');
      users.findByLoginWithSecrets.mockResolvedValue({
        id: 'u1',
        isActive: true,
        passwordHash,
      } as User);
      await expect(service.login({ login: 'john', password: 'wrong' })).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('issues a session for valid credentials', async () => {
      const passwordHash = await argon2.hash('correct');
      users.findByLoginWithSecrets.mockResolvedValue({
        id: 'u1',
        login: 'john',
        role: UserRole.Patient,
        isActive: true,
        passwordHash,
      } as User);

      const result = await service.login({ login: 'john', password: 'correct' });

      expect(result.accessToken).toBe('signed.token');
      expect(users.setRefreshTokenHash).toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    it('rejects when no refresh token is stored', async () => {
      users.findByIdWithRefreshToken.mockResolvedValue({
        id: 'u1',
        isActive: true,
        hashedRefreshToken: null,
      } as User);
      await expect(service.refresh('u1', 'token')).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects a mismatched refresh token', async () => {
      const hashedRefreshToken = await argon2.hash('real-token');
      users.findByIdWithRefreshToken.mockResolvedValue({
        id: 'u1',
        isActive: true,
        hashedRefreshToken,
      } as User);
      await expect(service.refresh('u1', 'fake-token')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('rotates tokens for a valid refresh token', async () => {
      const hashedRefreshToken = await argon2.hash('real-token');
      users.findByIdWithRefreshToken.mockResolvedValue({
        id: 'u1',
        login: 'john',
        role: UserRole.Patient,
        isActive: true,
        hashedRefreshToken,
      } as User);

      const result = await service.refresh('u1', 'real-token');

      expect(result.accessToken).toBe('signed.token');
      expect(users.setRefreshTokenHash).toHaveBeenCalledWith(
        'u1',
        expect.stringMatching(/^\$argon2/),
      );
    });
  });

  it('clears the stored refresh token on logout', async () => {
    await service.logout('u1');
    expect(users.setRefreshTokenHash).toHaveBeenCalledWith('u1', null);
  });
});
