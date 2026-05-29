import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

import { BaseEntity } from '../../../common/entities/base.entity';
import { NumericColumnTransformer } from '../../../common/transformers/numeric.transformer';
import { Appointment } from '../../appointments/entities/appointment.entity';

export enum PaymentStatus {
  Pending = 'PENDING',
  Success = 'SUCCESS',
  Failure = 'FAILURE',
}

@Entity('payments')
export class Payment extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 100 })
  liqpayOrderId: string;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
    transformer: new NumericColumnTransformer(),
  })
  amount: number;

  @Column({ type: 'varchar', length: 3, default: 'UAH' })
  currency: string;

  @Column({ type: 'varchar', length: 255 })
  description: string;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.Pending })
  status: PaymentStatus;

  @Column({ type: 'uuid', nullable: true })
  appointmentId: string | null;

  @ManyToOne(() => Appointment, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'appointment_id' })
  appointment: Appointment | null;
}
