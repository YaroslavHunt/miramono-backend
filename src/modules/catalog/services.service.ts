import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';

import { CacheService } from '../../common/cache/cache.service';
import { PaginatedResult, paginated } from '../../common/dto/paginated-result';
import { CreateServiceDto } from './dto/create-service.dto';
import { ServiceQueryDto } from './dto/service-query.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServiceCategory } from './entities/service-category.entity';
import { Service } from './entities/service.entity';

const CACHE_NAMESPACE = 'services';
const CACHE_TTL_MS = 60_000;

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private readonly services: Repository<Service>,
    @InjectRepository(ServiceCategory)
    private readonly categories: Repository<ServiceCategory>,
    private readonly cache: CacheService,
  ) {}

  async list(query: ServiceQueryDto): Promise<PaginatedResult<Service>> {
    const suffix = this.cache.serializeQuery({
      page: query.page,
      limit: query.limit,
      isActive: query.isActive,
      categoryId: query.categoryId,
    });
    const key = await this.cache.namespacedKey(CACHE_NAMESPACE, `list:${suffix}`);
    return this.cache.wrap(key, CACHE_TTL_MS, async () => {
      const where: FindOptionsWhere<Service> = { isActive: query.isActive ?? true };
      if (query.categoryId) {
        where.categoryId = query.categoryId;
      }

      const [items, total] = await this.services.findAndCount({
        where,
        relations: { category: true },
        order: { sortOrder: 'ASC', createdAt: 'ASC' },
        skip: query.skip,
        take: query.limit,
      });
      return paginated(items, total, query);
    });
  }

  async getById(id: string): Promise<Service> {
    const service = await this.services.findOne({
      where: { id },
      relations: { category: true },
    });
    if (!service) {
      throw new NotFoundException('Service not found');
    }
    return service;
  }

  async create(dto: CreateServiceDto): Promise<Service> {
    await this.assertCategoryExists(dto.categoryId);
    const service = await this.services.save(this.services.create(dto));
    await this.cache.invalidate(CACHE_NAMESPACE);
    return service;
  }

  async update(id: string, dto: UpdateServiceDto): Promise<Service> {
    const service = await this.getById(id);
    if (dto.categoryId && dto.categoryId !== service.categoryId) {
      await this.assertCategoryExists(dto.categoryId);
    }
    Object.assign(service, dto);
    const saved = await this.services.save(service);
    await this.cache.invalidate(CACHE_NAMESPACE);
    return saved;
  }

  async remove(id: string): Promise<void> {
    const service = await this.getById(id);
    await this.services.softRemove(service);
    await this.cache.invalidate(CACHE_NAMESPACE);
  }

  private async assertCategoryExists(categoryId: string): Promise<void> {
    const exists = await this.categories.exists({ where: { id: categoryId } });
    if (!exists) {
      throw new NotFoundException('Service category not found');
    }
  }
}
