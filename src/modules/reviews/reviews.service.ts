import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';

import { PaginatedResult, paginated } from '../../common/dto/paginated-result';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { Doctor } from '../doctors/entities/doctor.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewQueryDto } from './dto/review-query.dto';
import { Review } from './entities/review.entity';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviews: Repository<Review>,
    @InjectRepository(Doctor)
    private readonly doctors: Repository<Doctor>,
  ) {}

  async create(dto: CreateReviewDto): Promise<Review> {
    if (dto.doctorId) {
      await this.assertDoctorExists(dto.doctorId);
    }
    const review = this.reviews.create({
      authorName: dto.authorName,
      rating: dto.rating,
      text: dto.text,
      doctorId: dto.doctorId ?? null,
      isPublished: false,
    });
    return this.reviews.save(review);
  }

  async listPublished(query: PaginationQueryDto): Promise<PaginatedResult<Review>> {
    const [items, total] = await this.reviews.findAndCount({
      where: { isPublished: true },
      relations: { doctor: true },
      order: { createdAt: 'DESC' },
      skip: query.skip,
      take: query.limit,
    });
    return paginated(items, total, query);
  }

  async list(query: ReviewQueryDto): Promise<PaginatedResult<Review>> {
    const where: FindOptionsWhere<Review> = {};
    if (query.isPublished !== undefined) {
      where.isPublished = query.isPublished;
    }

    const [items, total] = await this.reviews.findAndCount({
      where,
      relations: { doctor: true },
      order: { createdAt: 'DESC' },
      skip: query.skip,
      take: query.limit,
    });
    return paginated(items, total, query);
  }

  async moderate(id: string, isPublished: boolean): Promise<Review> {
    const review = await this.getById(id);
    review.isPublished = isPublished;
    return this.reviews.save(review);
  }

  async remove(id: string): Promise<void> {
    const review = await this.getById(id);
    await this.reviews.softRemove(review);
  }

  private async getById(id: string): Promise<Review> {
    const review = await this.reviews.findOne({ where: { id } });
    if (!review) {
      throw new NotFoundException('Review not found');
    }
    return review;
  }

  private async assertDoctorExists(doctorId: string): Promise<void> {
    if (!(await this.doctors.exists({ where: { id: doctorId } }))) {
      throw new NotFoundException('Doctor not found');
    }
  }
}
