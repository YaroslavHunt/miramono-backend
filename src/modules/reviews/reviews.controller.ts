import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginatedResult } from '../../common/dto/paginated-result';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { UserRole } from '../users/entities/user.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { ModerateReviewDto } from './dto/moderate-review.dto';
import { ReviewQueryDto } from './dto/review-query.dto';
import { Review } from './entities/review.entity';
import { ReviewsService } from './reviews.service';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post()
  create(@Body() dto: CreateReviewDto): Promise<Review> {
    return this.reviews.create(dto);
  }

  @Public()
  @Get()
  listPublished(@Query() query: PaginationQueryDto): Promise<PaginatedResult<Review>> {
    return this.reviews.listPublished(query);
  }

  @Roles(UserRole.Admin)
  @ApiBearerAuth()
  @Get('admin')
  list(@Query() query: ReviewQueryDto): Promise<PaginatedResult<Review>> {
    return this.reviews.list(query);
  }

  @Roles(UserRole.Admin)
  @ApiBearerAuth()
  @Patch(':id')
  moderate(@Param('id') id: string, @Body() dto: ModerateReviewDto): Promise<Review> {
    return this.reviews.moderate(id, dto.isPublished);
  }

  @Roles(UserRole.Admin)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.reviews.remove(id);
  }
}
