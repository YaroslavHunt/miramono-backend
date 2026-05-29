import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import { BaseEntity } from '../../../common/entities/base.entity';
import { NumericColumnTransformer } from '../../../common/transformers/numeric.transformer';
import { ServiceCategory } from './service-category.entity';

@Entity('services')
export class Service extends BaseEntity {
  @Column({ type: 'varchar', length: 160 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
    transformer: new NumericColumnTransformer(),
  })
  price: number;

  @Column({ type: 'int', nullable: true })
  durationMinutes: number | null;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ type: 'uuid' })
  categoryId: string;

  @ManyToOne(() => ServiceCategory, (category) => category.services, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'category_id' })
  category: ServiceCategory;
}
