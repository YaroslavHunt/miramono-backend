import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';

import { CacheService } from '../../common/cache/cache.service';
import { createCacheMock } from '../../common/cache/cache.mock';
import { Doctor } from './entities/doctor.entity';
import { DoctorsService } from './doctors.service';

describe('DoctorsService', () => {
  let repo: {
    findAndCount: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    softRemove: jest.Mock;
  };
  let cache: ReturnType<typeof createCacheMock>;
  let service: DoctorsService;

  beforeEach(() => {
    repo = {
      findAndCount: jest.fn().mockResolvedValue([[], 0]),
      findOne: jest.fn(),
      create: jest.fn((data: Partial<Doctor>) => data as Doctor),
      save: jest.fn((entity: Partial<Doctor>) =>
        Promise.resolve({ id: 'd1', ...entity } as Doctor),
      ),
      softRemove: jest.fn(),
    };
    cache = createCacheMock();
    service = new DoctorsService(
      repo as unknown as Repository<Doctor>,
      cache as unknown as CacheService,
    );
  });

  it('lists only active doctors by default', async () => {
    await service.list({ page: 1, limit: 20, skip: 0 });
    const options = repo.findAndCount.mock.calls[0][0] as { where: { isActive: boolean } };
    expect(options.where.isActive).toBe(true);
  });

  it('creates a doctor', async () => {
    const created = await service.create({
      firstName: 'Ivan',
      lastName: 'Petrenko',
      specialization: 'Ортодонт',
    });
    expect(created.id).toBe('d1');
    expect(repo.save).toHaveBeenCalledTimes(1);
  });

  it('throws when updating a missing doctor', async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.update('nope', { firstName: 'X' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
