import { Column, Entity, Index, OneToMany } from 'typeorm';

import { BaseEntity } from '../../../common/entities/base.entity';
import { Service } from './service.entity';

@Entity('service_categories')
export class ServiceCategory extends BaseEntity {
  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 140 })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => Service, (service) => service.category)
  services: Service[];
}
