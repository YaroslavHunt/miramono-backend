import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';

import { PaginatedResult, paginated } from '../../common/dto/paginated-result';
import { Service } from '../catalog/entities/service.entity';
import { Doctor } from '../doctors/entities/doctor.entity';
import { CreateGalleryCaseDto } from './dto/create-gallery-case.dto';
import { GalleryCaseQueryDto } from './dto/gallery-case-query.dto';
import { UpdateGalleryCaseDto } from './dto/update-gallery-case.dto';
import { GalleryCase } from './entities/gallery-case.entity';

@Injectable()
export class GalleryService {
  constructor(
    @InjectRepository(GalleryCase)
    private readonly cases: Repository<GalleryCase>,
    @InjectRepository(Doctor)
    private readonly doctors: Repository<Doctor>,
    @InjectRepository(Service)
    private readonly services: Repository<Service>,
  ) {}

  async listPublished(query: GalleryCaseQueryDto): Promise<PaginatedResult<GalleryCase>> {
    const [items, total] = await this.cases.findAndCount({
      where: { isPublished: true },
      relations: { doctor: true, service: true },
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
      skip: query.skip,
      take: query.limit,
    });
    return paginated(items, total, query);
  }

  async findPublished(id: string): Promise<GalleryCase> {
    const item = await this.cases.findOne({
      where: { id, isPublished: true },
      relations: { doctor: true, service: true },
    });
    if (!item) {
      throw new NotFoundException('Gallery case not found');
    }
    return item;
  }

  async list(query: GalleryCaseQueryDto): Promise<PaginatedResult<GalleryCase>> {
    const where: FindOptionsWhere<GalleryCase> = {};
    if (query.isPublished !== undefined) {
      where.isPublished = query.isPublished;
    }

    const [items, total] = await this.cases.findAndCount({
      where,
      relations: { doctor: true, service: true },
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
      skip: query.skip,
      take: query.limit,
    });
    return paginated(items, total, query);
  }

  async getById(id: string): Promise<GalleryCase> {
    const item = await this.cases.findOne({
      where: { id },
      relations: { doctor: true, service: true },
    });
    if (!item) {
      throw new NotFoundException('Gallery case not found');
    }
    return item;
  }

  async create(dto: CreateGalleryCaseDto): Promise<GalleryCase> {
    await this.assertRelations(dto.doctorId, dto.serviceId);
    const item = this.cases.create({
      title: dto.title ?? null,
      description: dto.description ?? null,
      beforeImageUrl: dto.beforeImageUrl,
      afterImageUrl: dto.afterImageUrl,
      doctorId: dto.doctorId ?? null,
      serviceId: dto.serviceId ?? null,
      isPublished: dto.isPublished,
      sortOrder: dto.sortOrder,
    });
    return this.cases.save(item);
  }

  async update(id: string, dto: UpdateGalleryCaseDto): Promise<GalleryCase> {
    const item = await this.getById(id);
    await this.assertRelations(dto.doctorId, dto.serviceId);
    Object.assign(item, dto);
    return this.cases.save(item);
  }

  async remove(id: string): Promise<void> {
    const item = await this.getById(id);
    await this.cases.softRemove(item);
  }

  private async assertRelations(doctorId?: string, serviceId?: string): Promise<void> {
    if (doctorId && !(await this.doctors.exists({ where: { id: doctorId } }))) {
      throw new NotFoundException('Doctor not found');
    }
    if (serviceId && !(await this.services.exists({ where: { id: serviceId } }))) {
      throw new NotFoundException('Service not found');
    }
  }
}
