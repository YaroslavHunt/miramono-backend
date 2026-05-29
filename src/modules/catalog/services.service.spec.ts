import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';

import { CacheService } from '../../common/cache/cache.service';
import { createCacheMock } from '../../common/cache/cache.mock';
import { ServiceCategory } from './entities/service-category.entity';
import { Service } from './entities/service.entity';
import { ServicesService } from './services.service';

describe('ServicesService', () => {
  let services: {
    findAndCount: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    softRemove: jest.Mock;
  };
  let categories: { exists: jest.Mock };
  let service: ServicesService;

  beforeEach(() => {
    services = {
      findAndCount: jest.fn().mockResolvedValue([[], 0]),
      findOne: jest.fn(),
      create: jest.fn((data: Partial<Service>) => data as Service),
      save: jest.fn((entity: Partial<Service>) =>
        Promise.resolve({ id: 's1', ...entity } as Service),
      ),
      softRemove: jest.fn(),
    };
    categories = { exists: jest.fn() };
    service = new ServicesService(
      services as unknown as Repository<Service>,
      categories as unknown as Repository<ServiceCategory>,
      createCacheMock() as unknown as CacheService,
    );
  });

  describe('list', () => {
    it('filters by category and loads the category relation', async () => {
      await service.list({ page: 1, limit: 20, skip: 0, categoryId: 'c1' });

      const options = services.findAndCount.mock.calls[0][0] as {
        where: { isActive: boolean; categoryId?: string };
        relations: { category: boolean };
      };
      expect(options.where.categoryId).toBe('c1');
      expect(options.where.isActive).toBe(true);
      expect(options.relations.category).toBe(true);
    });
  });

  describe('create', () => {
    it('rejects an unknown category', async () => {
      categories.exists.mockResolvedValue(false);
      await expect(
        service.create({ name: 'Filling', price: 500, categoryId: 'missing' }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(services.save).not.toHaveBeenCalled();
    });

    it('saves when the category exists', async () => {
      categories.exists.mockResolvedValue(true);
      const created = await service.create({ name: 'Filling', price: 500, categoryId: 'c1' });
      expect(created.id).toBe('s1');
      expect(services.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('getById', () => {
    it('throws when the service is missing', async () => {
      services.findOne.mockResolvedValue(null);
      await expect(service.getById('nope')).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
