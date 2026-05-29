import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';

import { AppointmentsService } from './appointments.service';
import { Appointment, AppointmentStatus } from './entities/appointment.entity';
import { Service } from '../catalog/entities/service.entity';
import { Doctor } from '../doctors/entities/doctor.entity';

const future = () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
const past = () => new Date(Date.now() - 60 * 60 * 1000).toISOString();

const baseDto = () => ({
  fullName: 'Іван Петренко',
  phone: '+380501234567',
  preferredAt: future(),
});

describe('AppointmentsService', () => {
  let appointments: {
    findAndCount: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    exists: jest.Mock;
  };
  let services: { exists: jest.Mock };
  let doctors: { exists: jest.Mock };
  let service: AppointmentsService;

  beforeEach(() => {
    appointments = {
      findAndCount: jest.fn().mockResolvedValue([[], 0]),
      findOne: jest.fn(),
      create: jest.fn((data: Partial<Appointment>) => data as Appointment),
      save: jest.fn((entity: Partial<Appointment>) =>
        Promise.resolve({ id: 'a1', status: AppointmentStatus.New, ...entity } as Appointment),
      ),
      exists: jest.fn().mockResolvedValue(false),
    };
    services = { exists: jest.fn().mockResolvedValue(true) };
    doctors = { exists: jest.fn().mockResolvedValue(true) };
    service = new AppointmentsService(
      appointments as unknown as Repository<Appointment>,
      services as unknown as Repository<Service>,
      doctors as unknown as Repository<Doctor>,
    );
  });

  describe('create', () => {
    it('creates a guest appointment with a null patient', async () => {
      const created = await service.create(baseDto());
      expect(created.patientId).toBeNull();
      expect(created.status).toBe(AppointmentStatus.New);
      expect(appointments.save).toHaveBeenCalledTimes(1);
    });

    it('binds the patient when an authenticated user books', async () => {
      const created = await service.create(baseDto(), 'user-1');
      expect(created.patientId).toBe('user-1');
    });

    it('rejects a preferred time in the past', async () => {
      await expect(service.create({ ...baseDto(), preferredAt: past() })).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(appointments.save).not.toHaveBeenCalled();
    });

    it('rejects an unknown service', async () => {
      services.exists.mockResolvedValue(false);
      await expect(service.create({ ...baseDto(), serviceId: 'missing' })).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(appointments.save).not.toHaveBeenCalled();
    });

    it('rejects a doctor slot already taken by an active appointment', async () => {
      appointments.exists.mockResolvedValue(true);
      await expect(service.create({ ...baseDto(), doctorId: 'doc-1' })).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(appointments.save).not.toHaveBeenCalled();
    });
  });

  describe('updateStatus', () => {
    it('throws when the appointment is missing', async () => {
      appointments.findOne.mockResolvedValue(null);
      await expect(
        service.updateStatus('nope', AppointmentStatus.Confirmed),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('persists the new status', async () => {
      appointments.findOne.mockResolvedValue({ id: 'a1', status: AppointmentStatus.New });
      const updated = await service.updateStatus('a1', AppointmentStatus.Confirmed);
      expect(updated.status).toBe(AppointmentStatus.Confirmed);
      expect(appointments.save).toHaveBeenCalledTimes(1);
    });
  });
});
