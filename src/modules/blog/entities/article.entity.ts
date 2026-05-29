import { Column, Entity, Index } from 'typeorm';

import { BaseEntity } from '../../../common/entities/base.entity';

export enum ArticleStatus {
  Draft = 'DRAFT',
  Published = 'PUBLISHED',
}

export interface ArticleTranslation {
  title?: string;
  excerpt?: string;
  content?: string;
}

export interface ArticleTranslations {
  en?: ArticleTranslation;
}

@Entity('articles')
export class Article extends BaseEntity {
  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 220 })
  slug: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  excerpt: string | null;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  coverImageUrl: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  metaTitle: string | null;

  @Column({ type: 'varchar', length: 300, nullable: true })
  metaDescription: string | null;

  @Column({ type: 'jsonb', nullable: true })
  translations: ArticleTranslations | null;

  @Column({ type: 'enum', enum: ArticleStatus, default: ArticleStatus.Draft })
  status: ArticleStatus;

  @Column({ type: 'timestamptz', nullable: true })
  publishedAt: Date | null;
}
