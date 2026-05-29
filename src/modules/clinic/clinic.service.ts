import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CacheService } from '../../common/cache/cache.service';
import { UpdateClinicInfoDto } from './dto/update-clinic-info.dto';
import { ClinicInfo } from './entities/clinic-info.entity';

const CACHE_KEY = 'clinic-info';
const CACHE_TTL_MS = 300_000;

@Injectable()
export class ClinicService {
  constructor(
    @InjectRepository(ClinicInfo)
    private readonly clinic: Repository<ClinicInfo>,
    private readonly cache: CacheService,
  ) {}

  get(): Promise<ClinicInfo | null> {
    return this.cache.wrap(CACHE_KEY, CACHE_TTL_MS, () => this.load());
  }

  async upsert(dto: UpdateClinicInfoDto): Promise<ClinicInfo> {
    const existing = await this.load();
    const entity = existing ? Object.assign(existing, dto) : this.clinic.create(dto);
    const saved = await this.clinic.save(entity);
    await this.cache.del(CACHE_KEY);
    return saved;
  }

  private load(): Promise<ClinicInfo | null> {
    return this.clinic.findOne({ where: {}, order: { createdAt: 'ASC' } });
  }
}
