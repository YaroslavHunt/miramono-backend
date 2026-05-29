import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  FindOperator,
  FindOptionsWhere,
  In,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';

import { PaginatedResult, paginated } from '../../common/dto/paginated-result';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { Service } from '../catalog/entities/service.entity';
import { Doctor } from '../doctors/entities/doctor.entity';
import { AppointmentQueryDto } from './dto/appointment-query.dto';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { Appointment, AppointmentStatus } from './entities/appointment.entity';

const ACTIVE_STATUSES = [AppointmentStatus.New, AppointmentStatus.Confirmed];

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointments: Repository<Appointment>,
    @InjectRepository(Service)
    private readonly services: Repository<Service>,
    @InjectRepository(Doctor)
    private readonly doctors: Repository<Doctor>,
  ) {}

  async create(dto: CreateAppointmentDto, patientId?: string): Promise<Appointment> {
    const preferredAt = new Date(dto.preferredAt);
    if (preferredAt.getTime() <= Date.now()) {
      throw new BadRequestException('preferredAt must be in the future');
    }

    if (dto.serviceId) {
      await this.assertServiceExists(dto.serviceId);
    }
    if (dto.doctorId) {
      await this.assertDoctorExists(dto.doctorId);
      await this.assertSlotFree(dto.doctorId, preferredAt);
    }

    const appointment = this.appointments.create({
      fullName: dto.fullName,
      phone: dto.phone,
      email: dto.email ?? null,
      comment: dto.comment ?? null,
      preferredAt,
      serviceId: dto.serviceId ?? null,
      doctorId: dto.doctorId ?? null,
      patientId: patientId ?? null,
    });
    return this.appointments.save(appointment);
  }

  async listMine(
    patientId: string,
    query: PaginationQueryDto,
  ): Promise<PaginatedResult<Appointment>> {
    const [items, total] = await this.appointments.findAndCount({
      where: { patientId },
      relations: { service: true, doctor: true },
      order: { preferredAt: 'DESC' },
      skip: query.skip,
      take: query.limit,
    });
    return paginated(items, total, query);
  }

  async list(query: AppointmentQueryDto): Promise<PaginatedResult<Appointment>> {
    const where: FindOptionsWhere<Appointment> = {};
    if (query.status) {
      where.status = query.status;
    }
    if (query.doctorId) {
      where.doctorId = query.doctorId;
    }
    const range = this.dateRange(query.from, query.to);
    if (range) {
      where.preferredAt = range;
    }

    const [items, total] = await this.appointments.findAndCount({
      where,
      relations: { service: true, doctor: true, patient: true },
      order: { preferredAt: 'DESC' },
      skip: query.skip,
      take: query.limit,
    });
    return paginated(items, total, query);
  }

  async getById(id: string): Promise<Appointment> {
    const appointment = await this.appointments.findOne({
      where: { id },
      relations: { service: true, doctor: true, patient: true },
    });
    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }
    return appointment;
  }

  async updateStatus(id: string, status: AppointmentStatus): Promise<Appointment> {
    const appointment = await this.getById(id);
    appointment.status = status;
    return this.appointments.save(appointment);
  }

  private dateRange(from?: string, to?: string): FindOperator<Date> | undefined {
    if (from && to) {
      return Between(new Date(from), new Date(to));
    }
    if (from) {
      return MoreThanOrEqual(new Date(from));
    }
    if (to) {
      return LessThanOrEqual(new Date(to));
    }
    return undefined;
  }

  private async assertServiceExists(serviceId: string): Promise<void> {
    if (!(await this.services.exists({ where: { id: serviceId } }))) {
      throw new NotFoundException('Service not found');
    }
  }

  private async assertDoctorExists(doctorId: string): Promise<void> {
    if (!(await this.doctors.exists({ where: { id: doctorId } }))) {
      throw new NotFoundException('Doctor not found');
    }
  }

  private async assertSlotFree(doctorId: string, preferredAt: Date): Promise<void> {
    const taken = await this.appointments.exists({
      where: { doctorId, preferredAt, status: In(ACTIVE_STATUSES) },
    });
    if (taken) {
      throw new ConflictException('This time slot is already booked for the selected doctor');
    }
  }
}
