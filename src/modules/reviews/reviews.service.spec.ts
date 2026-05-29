import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';

import { Doctor } from '../doctors/entities/doctor.entity';
import { Review } from './entities/review.entity';
import { ReviewsService } from './reviews.service';

describe('ReviewsService', () => {
  let reviews: {
    findAndCount: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    softRemove: jest.Mock;
  };
  let doctors: { exists: jest.Mock };
  let service: ReviewsService;

  beforeEach(() => {
    reviews = {
      findAndCount: jest.fn().mockResolvedValue([[], 0]),
      findOne: jest.fn(),
      create: jest.fn((data: Partial<Review>) => data as Review),
      save: jest.fn((entity: Partial<Review>) =>
        Promise.resolve({ id: 'r1', ...entity } as Review),
      ),
      softRemove: jest.fn(),
    };
    doctors = { exists: jest.fn().mockResolvedValue(true) };
    service = new ReviewsService(
      reviews as unknown as Repository<Review>,
      doctors as unknown as Repository<Doctor>,
    );
  });

  describe('create', () => {
    it('queues a new review as unpublished', async () => {
      const created = await service.create({ authorName: 'Олена', rating: 5, text: 'Чудово' });
      expect(created.isPublished).toBe(false);
      expect(reviews.save).toHaveBeenCalledTimes(1);
    });

    it('rejects an unknown doctor', async () => {
      doctors.exists.mockResolvedValue(false);
      await expect(
        service.create({ authorName: 'Олена', rating: 5, text: 'Чудово', doctorId: 'missing' }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(reviews.save).not.toHaveBeenCalled();
    });
  });

  describe('listPublished', () => {
    it('returns only published reviews', async () => {
      await service.listPublished({ page: 1, limit: 20, skip: 0 });
      const options = reviews.findAndCount.mock.calls[0][0] as {
        where: { isPublished: boolean };
      };
      expect(options.where.isPublished).toBe(true);
    });
  });

  describe('moderate', () => {
    it('publishes a pending review', async () => {
      reviews.findOne.mockResolvedValue({ id: 'r1', isPublished: false });
      const updated = await service.moderate('r1', true);
      expect(updated.isPublished).toBe(true);
      expect(reviews.save).toHaveBeenCalledTimes(1);
    });

    it('throws when the review is missing', async () => {
      reviews.findOne.mockResolvedValue(null);
      await expect(service.moderate('nope', true)).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
