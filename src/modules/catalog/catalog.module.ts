import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CatalogSeeder } from './catalog.seeder';
import { ServiceCategory } from './entities/service-category.entity';
import { Service } from './entities/service.entity';
import { ServiceCategoriesController } from './service-categories.controller';
import { ServiceCategoriesService } from './service-categories.service';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';

@Module({
  imports: [TypeOrmModule.forFeature([ServiceCategory, Service])],
  controllers: [ServiceCategoriesController, ServicesController],
  providers: [ServiceCategoriesService, ServicesService, CatalogSeeder],
  exports: [ServiceCategoriesService, ServicesService],
})
export class CatalogModule {}
