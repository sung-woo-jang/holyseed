import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuoteRequest, QuoteRequestStatus } from './entities/quote-request.entity';
import { QuoteRequestItem } from './entities/quote-request-item.entity';
import { QuoteRequestPhoto } from './entities/quote-request-photo.entity';

function generateCode(): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const rand = String(Math.floor(Math.random() * 9000) + 1000);
  return `JR-${yy}${mm}-${rand}`;
}

export interface CreateRequestDto {
  contactName: string;
  contactPhone: string;
  contactAddress: string;
  memo?: string;
  prefDate?: string;
  prefTimeSlot?: string;
  items: Array<{
    itemCode: string;
    nameSnapshot: string;
    unitSnapshot?: string;
    priceSnapshot: number;
    productCode?: string;
    productSnapshot?: Record<string, any>;
  }>;
  photoUrls?: string[];
}

export interface LookupRequestDto {
  phone: string;
}

@Injectable()
export class RequestsService {
  constructor(
    @InjectRepository(QuoteRequest) private readonly reqRepo: Repository<QuoteRequest>,
    @InjectRepository(QuoteRequestItem) private readonly itemRepo: Repository<QuoteRequestItem>,
    @InjectRepository(QuoteRequestPhoto) private readonly photoRepo: Repository<QuoteRequestPhoto>,
  ) {}

  async create(dto: CreateRequestDto) {
    const itemsTotal = dto.items.reduce((sum, i) => {
      const productPrice = i.productSnapshot?.price || 0;
      return sum + i.priceSnapshot + productPrice;
    }, 0);

    const req = this.reqRepo.create({
      code: generateCode(),
      status: 'pending',
      contactName: dto.contactName,
      contactPhone: dto.contactPhone,
      contactAddress: dto.contactAddress,
      memo: dto.memo,
      prefDate: dto.prefDate,
      prefTimeSlot: dto.prefTimeSlot,
      visitFee: 20000,
      itemsTotal,
    });
    await this.reqRepo.save(req);

    for (let i = 0; i < dto.items.length; i++) {
      const item = dto.items[i];
      await this.itemRepo.save(this.itemRepo.create({ quoteRequestId: req.id, ...item, itemCode: item.itemCode }));
    }

    if (dto.photoUrls?.length) {
      for (let i = 0; i < dto.photoUrls.length; i++) {
        await this.photoRepo.save(this.photoRepo.create({ quoteRequestId: req.id, fileUrl: dto.photoUrls[i], sortOrder: i }));
      }
    }

    return this.findByCode(req.code);
  }

  async findByCode(code: string) {
    const req = await this.reqRepo.findOne({
      where: { code },
      relations: ['items', 'photos'],
    });
    if (!req) throw new NotFoundException('요청을 찾을 수 없어요.');
    return req;
  }

  async lookup(phone: string) {
    const normalized = phone.replace(/-/g, '');
    const all = await this.reqRepo.find({ relations: ['items', 'photos'], order: { id: 'DESC' } });
    return all.filter((r) => r.contactPhone.replace(/-/g, '') === normalized);
  }

  async adminList(status?: QuoteRequestStatus) {
    const qb = this.reqRepo.createQueryBuilder('r').leftJoinAndSelect('r.items', 'item').leftJoinAndSelect('r.photos', 'photo').orderBy('r.id', 'DESC');
    if (status) qb.where('r.status = :status', { status });
    return qb.getMany();
  }

  async updateStatus(code: string, status: QuoteRequestStatus) {
    const req = await this.reqRepo.findOne({ where: { code } });
    if (!req) throw new NotFoundException('요청을 찾을 수 없어요.');
    req.status = status;
    return this.reqRepo.save(req);
  }

  async cancel(code: string) {
    return this.updateStatus(code, 'cancelled');
  }

  async updateSchedule(code: string, prefDate: string | null, prefTimeSlot: string | null) {
    const req = await this.reqRepo.findOne({ where: { code } });
    if (!req) throw new NotFoundException('요청을 찾을 수 없어요.');
    req.prefDate = prefDate;
    req.prefTimeSlot = prefTimeSlot;
    return this.reqRepo.save(req);
  }
}
