import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';

import { PaginatedResult, paginated } from '../../common/dto/paginated-result';
import { ConsultationRequestQueryDto } from './dto/consultation-request-query.dto';
import { CreateConsultationRequestDto } from './dto/create-consultation-request.dto';
import { ConsultationRequest, ConsultationStatus } from './entities/consultation-request.entity';

@Injectable()
export class ConsultationsService {
  constructor(
    @InjectRepository(ConsultationRequest)
    private readonly requests: Repository<ConsultationRequest>,
  ) {}

  create(dto: CreateConsultationRequestDto): Promise<ConsultationRequest> {
    const request = this.requests.create({
      name: dto.name,
      phone: dto.phone,
      message: dto.message ?? null,
    });
    return this.requests.save(request);
  }

  async list(query: ConsultationRequestQueryDto): Promise<PaginatedResult<ConsultationRequest>> {
    const where: FindOptionsWhere<ConsultationRequest> = {};
    if (query.status) {
      where.status = query.status;
    }

    const [items, total] = await this.requests.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: query.skip,
      take: query.limit,
    });
    return paginated(items, total, query);
  }

  async updateStatus(id: string, status: ConsultationStatus): Promise<ConsultationRequest> {
    const request = await this.getById(id);
    request.status = status;
    return this.requests.save(request);
  }

  private async getById(id: string): Promise<ConsultationRequest> {
    const request = await this.requests.findOne({ where: { id } });
    if (!request) {
      throw new NotFoundException('Consultation request not found');
    }
    return request;
  }
}
