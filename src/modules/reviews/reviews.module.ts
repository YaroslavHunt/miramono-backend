import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Doctor } from '../doctors/entities/doctor.entity';
import { Review } from './entities/review.entity';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';

@Module({
  imports: [TypeOrmModule.forFeature([Review, Doctor])],
  controllers: [ReviewsController],
  providers: [ReviewsService],
})
export class ReviewsModule {}
