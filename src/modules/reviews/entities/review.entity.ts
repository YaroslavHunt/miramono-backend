import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import { BaseEntity } from '../../../common/entities/base.entity';
import { Doctor } from '../../doctors/entities/doctor.entity';

@Entity('reviews')
export class Review extends BaseEntity {
  @Column({ type: 'varchar', length: 160 })
  authorName: string;

  @Column({ type: 'int' })
  rating: number;

  @Column({ type: 'text' })
  text: string;

  @Column({ type: 'boolean', default: false })
  isPublished: boolean;

  @Column({ type: 'uuid', nullable: true })
  doctorId: string | null;

  @ManyToOne(() => Doctor, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'doctor_id' })
  doctor: Doctor | null;
}
