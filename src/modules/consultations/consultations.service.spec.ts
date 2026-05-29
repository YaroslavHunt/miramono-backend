import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';

import { ConsultationsService } from './consultations.service';
import { ConsultationRequest, ConsultationStatus } from './entities/consultation-request.entity';

describe('ConsultationsService', () => {
  let requests: {
    findAndCount: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let service: ConsultationsService;

  beforeEach(() => {
    requests = {
      findAndCount: jest.fn().mockResolvedValue([[], 0]),
      findOne: jest.fn(),
      create: jest.fn((data: Partial<ConsultationRequest>) => data as ConsultationRequest),
      save: jest.fn((entity: Partial<ConsultationRequest>) =>
        Promise.resolve({
          id: 'c1',
          status: ConsultationStatus.New,
          ...entity,
        } as ConsultationRequest),
      ),
    };
    service = new ConsultationsService(requests as unknown as Repository<ConsultationRequest>);
  });

  describe('create', () => {
    it('defaults an omitted message to null', async () => {
      const created = await service.create({ name: 'Олена', phone: '+380501112233' });
      expect(created.message).toBeNull();
      expect(created.status).toBe(ConsultationStatus.New);
    });
  });

  describe('list', () => {
    it('filters by status when provided', async () => {
      await service.list({ page: 1, limit: 20, skip: 0, status: ConsultationStatus.Processed });
      const options = requests.findAndCount.mock.calls[0][0] as {
        where: { status?: ConsultationStatus };
      };
      expect(options.where.status).toBe(ConsultationStatus.Processed);
    });
  });

  describe('updateStatus', () => {
    it('throws when the request is missing', async () => {
      requests.findOne.mockResolvedValue(null);
      await expect(
        service.updateStatus('nope', ConsultationStatus.Processed),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('persists the new status', async () => {
      requests.findOne.mockResolvedValue({ id: 'c1', status: ConsultationStatus.New });
      const updated = await service.updateStatus('c1', ConsultationStatus.Processed);
      expect(updated.status).toBe(ConsultationStatus.Processed);
      expect(requests.save).toHaveBeenCalledTimes(1);
    });
  });
});
