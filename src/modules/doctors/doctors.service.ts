import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CacheService } from '../../common/cache/cache.service';
import { PaginatedResult, paginated } from '../../common/dto/paginated-result';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { DoctorQueryDto } from './dto/doctor-query.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { Doctor } from './entities/doctor.entity';

const CACHE_NAMESPACE = 'doctors';
const CACHE_TTL_MS = 60_000;

@Injectable()
export class DoctorsService {
  constructor(
    @InjectRepository(Doctor)
    private readonly doctors: Repository<Doctor>,
    private readonly cache: CacheService,
  ) {}

  async list(query: DoctorQueryDto): Promise<PaginatedResult<Doctor>> {
    const suffix = this.cache.serializeQuery({
      page: query.page,
      limit: query.limit,
      isActive: query.isActive,
    });
    const key = await this.cache.namespacedKey(CACHE_NAMESPACE, `list:${suffix}`);
    return this.cache.wrap(key, CACHE_TTL_MS, async () => {
      const [items, total] = await this.doctors.findAndCount({
        where: { isActive: query.isActive ?? true },
        order: { sortOrder: 'ASC', createdAt: 'ASC' },
        skip: query.skip,
        take: query.limit,
      });
      return paginated(items, total, query);
    });
  }

  async getById(id: string): Promise<Doctor> {
    const doctor = await this.doctors.findOne({ where: { id } });
    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }
    return doctor;
  }

  async create(dto: CreateDoctorDto): Promise<Doctor> {
    const doctor = await this.doctors.save(this.doctors.create(dto));
    await this.cache.invalidate(CACHE_NAMESPACE);
    return doctor;
  }

  async update(id: string, dto: UpdateDoctorDto): Promise<Doctor> {
    const doctor = await this.getById(id);
    Object.assign(doctor, dto);
    const saved = await this.doctors.save(doctor);
    await this.cache.invalidate(CACHE_NAMESPACE);
    return saved;
  }

  async remove(id: string): Promise<void> {
    const doctor = await this.getById(id);
    await this.doctors.softRemove(doctor);
    await this.cache.invalidate(CACHE_NAMESPACE);
  }
}
