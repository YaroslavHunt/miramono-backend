import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ClinicController } from './clinic.controller';
import { ClinicService } from './clinic.service';
import { ClinicInfo } from './entities/clinic-info.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ClinicInfo])],
  controllers: [ClinicController],
  providers: [ClinicService],
  exports: [ClinicService],
})
export class ClinicModule {}
