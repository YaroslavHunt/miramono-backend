import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Service } from '../catalog/entities/service.entity';
import { Doctor } from '../doctors/entities/doctor.entity';
import { GalleryCase } from './entities/gallery-case.entity';
import { GalleryController } from './gallery.controller';
import { GalleryService } from './gallery.service';

@Module({
  imports: [TypeOrmModule.forFeature([GalleryCase, Doctor, Service])],
  controllers: [GalleryController],
  providers: [GalleryService],
})
export class GalleryModule {}
