import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import { BaseEntity } from '../../../common/entities/base.entity';
import { Service } from '../../catalog/entities/service.entity';
import { Doctor } from '../../doctors/entities/doctor.entity';
import { User } from '../../users/entities/user.entity';

export enum AppointmentStatus {
  New = 'NEW',
  Confirmed = 'CONFIRMED',
  Cancelled = 'CANCELLED',
  Completed = 'COMPLETED',
}

@Entity('appointments')
export class Appointment extends BaseEntity {
  @Column({ type: 'varchar', length: 160 })
  fullName: string;

  @Column({ type: 'varchar', length: 50 })
  phone: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null;

  @Column({ type: 'timestamptz' })
  preferredAt: Date;

  @Column({ type: 'text', nullable: true })
  comment: string | null;

  @Column({ type: 'enum', enum: AppointmentStatus, default: AppointmentStatus.New })
  status: AppointmentStatus;

  @Column({ type: 'uuid', nullable: true })
  patientId: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'patient_id' })
  patient: User | null;

  @Column({ type: 'uuid', nullable: true })
  serviceId: string | null;

  @ManyToOne(() => Service, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'service_id' })
  service: Service | null;

  @Column({ type: 'uuid', nullable: true })
  doctorId: string | null;

  @ManyToOne(() => Doctor, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'doctor_id' })
  doctor: Doctor | null;
}
