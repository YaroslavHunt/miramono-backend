import { ConflictException } from '@nestjs/common';
import { Repository } from 'typeorm';

import { User, UserRole } from './entities/user.entity';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let repo: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    update: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let service: UsersService;

  beforeEach(() => {
    repo = {
      findOne: jest.fn(),
      create: jest.fn((data: Partial<User>) => data as User),
      save: jest.fn((user: Partial<User>) => Promise.resolve({ id: 'u1', ...user } as User)),
      update: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    service = new UsersService(repo as unknown as Repository<User>);
  });

  describe('create', () => {
    it('hashes the password and defaults the role to PATIENT', async () => {
      repo.findOne.mockResolvedValue(null);

      await service.create({
        login: 'john',
        password: 'secret123',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+380501234567',
      });

      const created = repo.create.mock.calls[0][0] as User;
      expect(created.passwordHash).toMatch(/^\$argon2/);
      expect(created.passwordHash).not.toBe('secret123');
      expect(created.role).toBe(UserRole.Patient);
      expect(repo.save).toHaveBeenCalledTimes(1);
    });

    it('rejects a duplicate login', async () => {
      repo.findOne.mockResolvedValue({ id: 'existing' });

      await expect(
        service.create({
          login: 'john',
          password: 'secret123',
          firstName: 'J',
          lastName: 'D',
          phone: '1234567',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(repo.save).not.toHaveBeenCalled();
    });
  });

  describe('ensureAdmin', () => {
    it('creates the admin when it is missing', async () => {
      repo.findOne.mockResolvedValue(null);

      const created = await service.ensureAdmin('admin', 'admin-pass');

      expect(created).toBe(true);
      const seeded = repo.create.mock.calls[0][0] as User;
      expect(seeded.role).toBe(UserRole.Admin);
      expect(repo.save).toHaveBeenCalledTimes(1);
    });

    it('does nothing when the admin already exists', async () => {
      repo.findOne.mockResolvedValue({ id: 'a1' });

      const created = await service.ensureAdmin('admin', 'admin-pass');

      expect(created).toBe(false);
      expect(repo.save).not.toHaveBeenCalled();
    });
  });
});
