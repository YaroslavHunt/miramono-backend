import { Repository } from 'typeorm';

import { CacheService } from '../../common/cache/cache.service';
import { createCacheMock } from '../../common/cache/cache.mock';
import { ClinicService } from './clinic.service';
import { ClinicInfo } from './entities/clinic-info.entity';

describe('ClinicService', () => {
  let repo: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let service: ClinicService;

  const payload = {
    phone: '+380320000000',
    address: 'Львів, вул. Стоматологічна, 1',
    workingHours: 'Пн–Пт 9:00–19:00',
  };

  beforeEach(() => {
    repo = {
      findOne: jest.fn(),
      create: jest.fn((data: Partial<ClinicInfo>) => data as ClinicInfo),
      save: jest.fn((entity: Partial<ClinicInfo>) =>
        Promise.resolve({ id: 'singleton', ...entity } as ClinicInfo),
      ),
    };
    service = new ClinicService(
      repo as unknown as Repository<ClinicInfo>,
      createCacheMock() as unknown as CacheService,
    );
  });

  it('creates the record when none exists', async () => {
    repo.findOne.mockResolvedValue(null);
    const result = await service.upsert(payload);
    expect(repo.create).toHaveBeenCalledWith(payload);
    expect(result.id).toBe('singleton');
  });

  it('updates the existing record instead of creating a new one', async () => {
    const existing = { id: 'singleton', phone: 'old' } as ClinicInfo;
    repo.findOne.mockResolvedValue(existing);

    const result = await service.upsert(payload);

    expect(repo.create).not.toHaveBeenCalled();
    expect(repo.save).toHaveBeenCalledWith(existing);
    expect(result.phone).toBe(payload.phone);
  });
});
