import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CacheService } from '../../common/cache/cache.service';
import { PaginatedResult, paginated } from '../../common/dto/paginated-result';
import { CreateServiceCategoryDto } from './dto/create-service-category.dto';
import { ServiceCategoryQueryDto } from './dto/service-category-query.dto';
import { UpdateServiceCategoryDto } from './dto/update-service-category.dto';
import { ServiceCategory } from './entities/service-category.entity';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CACHE_NAMESPACE = 'service-categories';
const CACHE_TTL_MS = 60_000;

@Injectable()
export class ServiceCategoriesService {
  constructor(
    @InjectRepository(ServiceCategory)
    private readonly categories: Repository<ServiceCategory>,
    private readonly cache: CacheService,
  ) {}

  async list(query: ServiceCategoryQueryDto): Promise<PaginatedResult<ServiceCategory>> {
    const suffix = this.cache.serializeQuery({
      page: query.page,
      limit: query.limit,
      isActive: query.isActive,
    });
    const key = await this.cache.namespacedKey(CACHE_NAMESPACE, `list:${suffix}`);
    return this.cache.wrap(key, CACHE_TTL_MS, async () => {
      const [items, total] = await this.categories.findAndCount({
        where: { isActive: query.isActive ?? true },
        order: { sortOrder: 'ASC', createdAt: 'ASC' },
        skip: query.skip,
        take: query.limit,
      });
      return paginated(items, total, query);
    });
  }

  async findOne(idOrSlug: string): Promise<ServiceCategory> {
    const where = UUID_PATTERN.test(idOrSlug) ? { id: idOrSlug } : { slug: idOrSlug };
    const category = await this.categories.findOne({ where });
    if (!category) {
      throw new NotFoundException('Service category not found');
    }
    return category;
  }

  async getById(id: string): Promise<ServiceCategory> {
    const category = await this.categories.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException('Service category not found');
    }
    return category;
  }

  async create(dto: CreateServiceCategoryDto): Promise<ServiceCategory> {
    await this.assertSlugFree(dto.slug);
    const category = await this.categories.save(this.categories.create(dto));
    await this.cache.invalidate(CACHE_NAMESPACE);
    return category;
  }

  async update(id: string, dto: UpdateServiceCategoryDto): Promise<ServiceCategory> {
    const category = await this.getById(id);
    if (dto.slug && dto.slug !== category.slug) {
      await this.assertSlugFree(dto.slug);
    }
    Object.assign(category, dto);
    const saved = await this.categories.save(category);
    await this.cache.invalidate(CACHE_NAMESPACE);
    return saved;
  }

  async remove(id: string): Promise<void> {
    const category = await this.getById(id);
    await this.categories.softRemove(category);
    await this.cache.invalidate(CACHE_NAMESPACE);
  }

  private async assertSlugFree(slug: string): Promise<void> {
    const existing = await this.categories.findOne({ where: { slug } });
    if (existing) {
      throw new ConflictException('Slug already taken');
    }
  }
}
