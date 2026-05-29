import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';

import { Service } from '../catalog/entities/service.entity';
import { Doctor } from '../doctors/entities/doctor.entity';
import { GalleryCase } from './entities/gallery-case.entity';
import { GalleryService } from './gallery.service';

describe('GalleryService', () => {
  let cases: {
    findAndCount: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    softRemove: jest.Mock;
  };
  let doctors: { exists: jest.Mock };
  let services: { exists: jest.Mock };
  let service: GalleryService;

  const baseDto = () => ({
    beforeImageUrl: '/uploads/before.png',
    afterImageUrl: '/uploads/after.png',
  });

  beforeEach(() => {
    cases = {
      findAndCount: jest.fn().mockResolvedValue([[], 0]),
      findOne: jest.fn(),
      create: jest.fn((data: Partial<GalleryCase>) => data as GalleryCase),
      save: jest.fn((entity: Partial<GalleryCase>) =>
        Promise.resolve({ id: 'g1', ...entity } as GalleryCase),
      ),
      softRemove: jest.fn(),
    };
    doctors = { exists: jest.fn().mockResolvedValue(true) };
    services = { exists: jest.fn().mockResolvedValue(true) };
    service = new GalleryService(
      cases as unknown as Repository<GalleryCase>,
      doctors as unknown as Repository<Doctor>,
      services as unknown as Repository<Service>,
    );
  });

  describe('listPublished', () => {
    it('returns only published cases with relations', async () => {
      await service.listPublished({ page: 1, limit: 20, skip: 0 });
      const options = cases.findAndCount.mock.calls[0][0] as {
        where: { isPublished: boolean };
        relations: { doctor: boolean; service: boolean };
      };
      expect(options.where.isPublished).toBe(true);
      expect(options.relations.doctor).toBe(true);
      expect(options.relations.service).toBe(true);
    });
  });

  describe('create', () => {
    it('saves a case with valid relations', async () => {
      const created = await service.create({ ...baseDto(), doctorId: 'd1', serviceId: 's1' });
      expect(created.id).toBe('g1');
      expect(cases.save).toHaveBeenCalledTimes(1);
    });

    it('rejects an unknown doctor', async () => {
      doctors.exists.mockResolvedValue(false);
      await expect(service.create({ ...baseDto(), doctorId: 'missing' })).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(cases.save).not.toHaveBeenCalled();
    });

    it('rejects an unknown service', async () => {
      services.exists.mockResolvedValue(false);
      await expect(service.create({ ...baseDto(), serviceId: 'missing' })).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(cases.save).not.toHaveBeenCalled();
    });
  });

  describe('getById', () => {
    it('throws when the case is missing', async () => {
      cases.findOne.mockResolvedValue(null);
      await expect(service.getById('nope')).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
