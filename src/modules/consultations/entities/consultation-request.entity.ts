import { Column, Entity } from 'typeorm';

import { BaseEntity } from '../../../common/entities/base.entity';

export enum ConsultationStatus {
  New = 'NEW',
  Processed = 'PROCESSED',
}

@Entity('consultation_requests')
export class ConsultationRequest extends BaseEntity {
  @Column({ type: 'varchar', length: 160 })
  name: string;

  @Column({ type: 'varchar', length: 50 })
  phone: string;

  @Column({ type: 'text', nullable: true })
  message: string | null;

  @Column({ type: 'enum', enum: ConsultationStatus, default: ConsultationStatus.New })
  status: ConsultationStatus;
}
