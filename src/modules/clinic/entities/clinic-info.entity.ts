import { Column, Entity } from 'typeorm';

import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('clinic_info')
export class ClinicInfo extends BaseEntity {
  @Column({ type: 'varchar', length: 50 })
  phone: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', length: 300 })
  address: string;

  @Column({ type: 'varchar', length: 200 })
  workingHours: string;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  mapUrl: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  instagramUrl: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  facebookUrl: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  telegramUrl: string | null;

  @Column({ type: 'int', default: 0 })
  yearsExperience: number;

  @Column({ type: 'int', default: 0 })
  happyPatients: number;

  @Column({ type: 'int', default: 0 })
  specialistsCount: number;
}
