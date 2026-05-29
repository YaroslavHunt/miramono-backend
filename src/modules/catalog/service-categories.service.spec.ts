import { ConflictException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';

import { CacheService } from '../../common/cache/cache.service';
import { createCacheMock } from '../../common/cache/cache.mock';
import { ServiceCategory } from './entities/service-category.entity';
import { ServiceCategoriesService } from './service-categories.service';

describe('ServiceCategoriesService', () => {
  let repo: {
    findAndCount: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    softRemove: jest.Mock;
  };
  let service: ServiceCategoriesService;

  beforeEach(() => {
    repo = {
      findAndCount: jest.fn().mockResolvedValue([[], 0]),
      findOne: jest.fn(),
      create: jest.fn((data: Partial<ServiceCategory>) => data as ServiceCategory),
      save: jest.fn((entity: Partial<ServiceCategory>) =>
        Promise.resolve({ id: 'c1', ...entity } as ServiceCategory),
      ),
      softRemove: jest.fn(),
    };
    service = new ServiceCategoriesService(
      repo as unknown as Repository<ServiceCategory>,
      createCacheMock() as unknown as CacheService,
    );
  });

  describe('list', () => {
    it('defaults to active categories sorted by sortOrder', async () => {
      await service.list({ page: 1, limit: 20, skip: 0 });

      const options = repo.findAndCount.mock.calls[0][0] as {
        where: { isActive: boolean };
        order: Record<string, string>;
      };
      expect(options.where.isActive).toBe(true);
      expect(options.order.sortOrder).toBe('ASC');
    });

    it('honours an explicit isActive filter', async () => {
      await service.list({ page: 1, limit: 20, skip: 0, isActive: false });

      const options = repo.findAndCount.mock.calls[0][0] as { where: { isActive: boolean } };
      expect(options.where.isActive).toBe(false);
    });
  });

  describe('findOne', () => {
    it('looks up by id when given a uuid', async () => {
      repo.findOne.mockResolvedValue({ id: 'x' });
      await service.findOne('11111111-1111-1111-1111-111111111111');
      expect(repo.findOne.mock.calls[0][0]).toEqual({
        where: { id: '11111111-1111-1111-1111-111111111111' },
      });
    });

    it('looks up by slug otherwise', async () => {
      repo.findOne.mockResolvedValue({ id: 'x' });
      await service.findOne('therapy');
      expect(repo.findOne.mock.calls[0][0]).toEqual({ where: { slug: 'therapy' } });
    });

    it('throws when nothing is found', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.findOne('missing')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('create', () => {
    it('rejects a duplicate slug', async () => {
      repo.findOne.mockResolvedValue({ id: 'existing' });
      await expect(service.create({ name: 'Therapy', slug: 'therapy' })).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('saves when the slug is free', async () => {
      repo.findOne.mockResolvedValue(null);
      const created = await service.create({ name: 'Therapy', slug: 'therapy' });
      expect(created.id).toBe('c1');
      expect(repo.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('remove', () => {
    it('soft removes an existing category', async () => {
      repo.findOne.mockResolvedValue({ id: 'c1' });
      await service.remove('c1');
      expect(repo.softRemove).toHaveBeenCalledWith({ id: 'c1' });
    });
  });
});
