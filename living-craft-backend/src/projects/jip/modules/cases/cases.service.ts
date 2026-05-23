import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Case } from './entities/case.entity';

@Injectable()
export class CasesService {
  constructor(
    @InjectRepository(Case) private readonly caseRepo: Repository<Case>,
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
}
