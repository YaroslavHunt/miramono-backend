import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';

import { ServiceCategory } from './entities/service-category.entity';

const PG_UNIQUE_VIOLATION = '23505';

const BASE_CATEGORIES: Array<Pick<ServiceCategory, 'name' | 'slug' | 'description' | 'sortOrder'>> =
  [
    {
      name: 'Терапевтична стоматологія',
      slug: 'therapy',
      description: 'Лікування карієсу, пульпіту та захворювань ясен.',
      sortOrder: 1,
    },
    {
      name: 'Імплантація',
      slug: 'implantation',
      description: 'Відновлення втрачених зубів за допомогою імплантів.',
      sortOrder: 2,
    },
    {
      name: 'Ортодонтія',
      slug: 'orthodontics',
      description: 'Виправлення прикусу брекет-системами та елайнерами.',
      sortOrder: 3,
    },
    {
      name: 'Естетична стоматологія',
      slug: 'aesthetic',
      description: 'Відбілювання, вініри та реставрація усмішки.',
      sortOrder: 4,
    },
  ];

@Injectable()
export class CatalogSeeder implements OnApplicationBootstrap {
  private readonly logger = new Logger(CatalogSeeder.name);

  constructor(
    @InjectRepository(ServiceCategory)
    private readonly categories: Repository<ServiceCategory>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    let created = 0;
    for (const data of BASE_CATEGORIES) {
      const exists = await this.categories.exists({
        where: { slug: data.slug },
        withDeleted: true,
      });
      if (exists) {
        continue;
      }
      try {
        await this.categories.save(this.categories.create(data));
        created += 1;
      } catch (error) {
        // a concurrent boot/replica may seed the same slug first — that is fine
        if (!this.isUniqueViolation(error)) {
          throw error;
        }
      }
    }
    if (created > 0) {
      this.logger.log(`Seeded ${created} base treatment direction(s)`);
    }
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      error instanceof QueryFailedError &&
      (error as QueryFailedError & { code?: string }).code === PG_UNIQUE_VIOLATION
    );
  }
}
