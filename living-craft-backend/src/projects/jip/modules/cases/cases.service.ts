import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Case } from './entities/case.entity';
import { CaseTag } from './entities/case-tag.entity';
import { CasePhoto } from './entities/case-photo.entity';
import { CreateCaseDto } from './dto/create-case.dto';

@Injectable()
export class CasesService {
  constructor(
    @InjectRepository(Case) private readonly caseRepo: Repository<Case>,
    @InjectRepository(CaseTag) private readonly tagRepo: Repository<CaseTag>,
    @InjectRepository(CasePhoto) private readonly photoRepo: Repository<CasePhoto>,
  ) {}

  async findAll(tag?: string) {
    const qb = this.caseRepo.createQueryBuilder('c')
      .leftJoinAndSelect('c.tags', 'tag')
      .leftJoinAndSelect('c.photos', 'photo')
      .where('c.isPublished = true');

    if (tag && tag !== 'all') {
      qb.andWhere('EXISTS (SELECT 1 FROM jip.case_tags t WHERE t.case_id = c.id AND t.tag = :tag)', { tag });
    }

    return qb.orderBy('c.sortOrder', 'DESC').addOrderBy('c.id', 'DESC').getMany();
  }

  async findRecent(limit = 3) {
    return this.caseRepo.find({
      where: { isPublished: true },
      relations: ['tags', 'photos'],
      order: { sortOrder: 'DESC', id: 'DESC' },
      take: limit,
    });
  }

  async findOne(id: number) {
    const c = await this.caseRepo.findOne({
      where: { id, isPublished: true },
      relations: ['tags', 'photos'],
    });
    if (!c) throw new NotFoundException('시공사례를 찾을 수 없어요.');
    return c;
  }

  // ===== 관리자 메서드 =====

  async adminList() {
    return this.caseRepo.find({
      relations: ['tags', 'photos'],
      order: { sortOrder: 'DESC', id: 'DESC' },
    });
  }

  async adminGet(id: number) {
    const c = await this.caseRepo.findOne({
      where: { id },
      relations: ['tags', 'photos'],
    });
    if (!c) throw new NotFoundException('시공사례를 찾을 수 없어요.');
    return c;
  }

  async create(dto: CreateCaseDto) {
    const c = this.caseRepo.create({
      title: dto.title,
      area: dto.area ?? null,
      hours: dto.hours ?? null,
      dateText: dto.dateText ?? null,
      color: dto.color ?? 'default',
      intro: dto.intro ?? null,
      story: dto.story ?? null,
      isPublished: dto.isPublished ?? true,
      sortOrder: 0,
    });
    await this.caseRepo.save(c);

    if (dto.tags?.length) {
      for (const tag of dto.tags) {
        await this.tagRepo.save(this.tagRepo.create({ caseId: c.id, tag }));
      }
    }
    if (dto.photos?.length) {
      for (let i = 0; i < dto.photos.length; i++) {
        const p = dto.photos[i];
        await this.photoRepo.save(this.photoRepo.create({
          caseId: c.id, fileUrl: p.fileUrl, role: p.role, label: p.label ?? null, sortOrder: i,
        }));
      }
    }

    return this.adminGet(c.id);
  }

  async update(id: number, dto: CreateCaseDto) {
    const c = await this.adminGet(id);

    c.title = dto.title ?? c.title;
    c.area = dto.area ?? c.area;
    c.hours = dto.hours ?? c.hours;
    c.dateText = dto.dateText ?? c.dateText;
    c.color = dto.color ?? c.color;
    c.intro = dto.intro ?? c.intro;
    c.story = dto.story ?? c.story;
    if (dto.isPublished !== undefined) c.isPublished = dto.isPublished;
    await this.caseRepo.save(c);

    if (dto.tags !== undefined) {
      await this.tagRepo.delete({ caseId: id });
      for (const tag of dto.tags) {
        await this.tagRepo.save(this.tagRepo.create({ caseId: id, tag }));
      }
    }
    if (dto.photos !== undefined) {
      await this.photoRepo.delete({ caseId: id });
      for (let i = 0; i < dto.photos.length; i++) {
        const p = dto.photos[i];
        await this.photoRepo.save(this.photoRepo.create({
          caseId: id, fileUrl: p.fileUrl, role: p.role, label: p.label ?? null, sortOrder: i,
        }));
      }
    }

    return this.adminGet(id);
  }

  async remove(id: number) {
    const c = await this.adminGet(id);
    await this.tagRepo.delete({ caseId: id });
    await this.photoRepo.delete({ caseId: id });
    await this.caseRepo.remove(c);
  }

  async togglePublish(id: number, isPublished: boolean) {
    const c = await this.adminGet(id);
    c.isPublished = isPublished;
    await this.caseRepo.save(c);
    return this.adminGet(id);
  }
}
