import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { Job, JobStatus } from './entities/job.entity';
import { JobPhoto } from './entities/job-photo.entity';
import { pickAllowedFields } from './utils/pick-allowed-fields.util';

function nanoid24(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let s = '';
  const array = new Uint8Array(24);
  for (let i = 0; i < 24; i++) array[i] = Math.floor(Math.random() * chars.length);
  for (let i = 0; i < 24; i++) s += chars[array[i]];
  return s;
}

export interface CreateJobDto {
  customerName?: string;
  phone?: string;
  addressFull?: string;
  addressShort?: string;
  inquiryDate?: string;
  workDate?: string;
  status?: JobStatus;
  productName?: string;
  brand?: string;
  model?: string;
  requestNote?: string;
  workSummary?: string;
  sellingPrice?: number;
  costPrice?: number;
  materialSource?: string;
  paid?: boolean;
  paidDate?: string;
  internalMemo?: string;
  isPublished?: boolean;
  publicFields?: string[];
  photos?: Array<{ role: 'before' | 'after'; label: string; fileUrl: string }>;
}

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(Job) private readonly jobRepo: Repository<Job>,
    @InjectRepository(JobPhoto) private readonly photoRepo: Repository<JobPhoto>,
  ) {}

  // 관리자 — 전체 필드 반환
  async adminList(q?: string, status?: string) {
    const qb = this.jobRepo.createQueryBuilder('job')
      .leftJoinAndSelect('job.photos', 'photo')
      .orderBy('job.updatedAt', 'DESC');

    if (status && status !== 'all') qb.where('job.status = :status', { status });
    if (q) {
      const kw = `%${q}%`;
      qb.andWhere('(job.customerName ILIKE :kw OR job.addressShort ILIKE :kw OR job.productName ILIKE :kw OR job.brand ILIKE :kw)', { kw });
    }
    return qb.getMany();
  }

  async adminFindOne(id: string): Promise<Job & { photos: JobPhoto[] }> {
    const job = await this.jobRepo.findOne({ where: { id }, relations: ['photos'] });
    if (!job) throw new NotFoundException('일지를 찾을 수 없어요.');
    return job as Job & { photos: JobPhoto[] };
  }

  // 공개 엔드포인트 — 화이트리스트 분기
  async findPublic(id: string, isAdmin: boolean) {
    const job = await this.jobRepo.findOne({ where: { id }, relations: ['photos'] }) as Job & { photos: JobPhoto[] };

    if (!job) throw new NotFoundException('일지를 찾을 수 없어요.');
    if (!isAdmin && !job.isPublished) throw new NotFoundException('일지를 찾을 수 없어요.');

    if (isAdmin) {
      return job; // 모든 필드
    }
    return pickAllowedFields(job);
  }

  async create(dto: CreateJobDto): Promise<Job> {
    const { photos, ...jobData } = dto;
    const job = this.jobRepo.create({ id: nanoid24(), ...jobData });
    await this.jobRepo.save(job);

    if (photos?.length) {
      for (let i = 0; i < photos.length; i++) {
        await this.photoRepo.save(this.photoRepo.create({ jobId: job.id, ...photos[i], sortOrder: i }));
      }
    }
    return this.adminFindOne(job.id);
  }

  async update(id: string, dto: CreateJobDto): Promise<Job> {
    const job = await this.adminFindOne(id);
    const { photos, ...jobData } = dto;
    Object.assign(job, jobData);
    await this.jobRepo.save(job);

    if (photos !== undefined) {
      await this.photoRepo.delete({ jobId: id });
      for (let i = 0; i < photos.length; i++) {
        await this.photoRepo.save(this.photoRepo.create({ jobId: id, ...photos[i], sortOrder: i }));
      }
    }
    return this.adminFindOne(id);
  }

  async delete(id: string) {
    const job = await this.adminFindOne(id);
    await this.photoRepo.delete({ jobId: id });
    await this.jobRepo.remove(job);
  }

  async togglePublish(id: string, isPublished: boolean) {
    const job = await this.adminFindOne(id);
    job.isPublished = isPublished;
    return this.jobRepo.save(job);
  }

  async monthlyRevenue(): Promise<number> {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
    const result = await this.jobRepo
      .createQueryBuilder('job')
      .select('SUM(job.sellingPrice)', 'total')
      .where('job.paid = true AND job.paidDate BETWEEN :start AND :end', { start, end })
      .getRawOne();
    return Number(result?.total || 0);
  }
}
