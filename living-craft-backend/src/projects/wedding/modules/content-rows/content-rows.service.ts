import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WeddingContentRow } from './entities/wedding-content-row.entity';
import { CreateContentRowDto } from './dto/request/create-content-row.dto';
import { UpdateContentRowDto } from './dto/request/update-content-row.dto';
import { SearchContentRowsDto } from './dto/request/search-content-rows.dto';
import { WeddingUserRole } from '../auth/entities/wedding-user.entity';

@Injectable()
export class ContentRowsService {
  constructor(
    @InjectRepository(WeddingContentRow)
    private readonly rowRepo: Repository<WeddingContentRow>,
  ) {}

  /**
   * 목록 조회 (includeHidden=false면 공개, true면 관리자)
   */
  async search(
    dto: SearchContentRowsDto,
    user?: { coupleId: string; role: string },
  ): Promise<WeddingContentRow[]> {
    if (dto.includeHidden) {
      if (!user) throw new ForbiddenException('인증이 필요합니다.');
      this._checkAccess(dto.coupleId, user);
    }

    const where: Partial<WeddingContentRow> = { coupleId: dto.coupleId };
    if (!dto.includeHidden) {
      where.isVisible = true;
    }

    return this.rowRepo.find({
      where,
      order: { order: 'ASC', createdAt: 'ASC' },
    });
  }

  async findById(id: string, user?: { coupleId: string; role: string }): Promise<WeddingContentRow> {
    const row = await this.rowRepo.findOne({ where: { id } });
    if (!row) {
      throw new NotFoundException('콘텐츠 행을 찾을 수 없습니다.');
    }

    // 숨김 행은 관리자만 접근
    if (!row.isVisible) {
      if (!user) throw new ForbiddenException('접근 권한이 없습니다.');
      this._checkAccess(row.coupleId, user);
    }

    return row;
  }

  async create(dto: CreateContentRowDto, user: { coupleId: string; role: string }): Promise<WeddingContentRow> {
    this._checkAccess(dto.coupleId, user);
    const row = this.rowRepo.create(dto);
    return this.rowRepo.save(row);
  }

  async update(
    id: string,
    dto: UpdateContentRowDto,
    user: { coupleId: string; role: string },
  ): Promise<WeddingContentRow> {
    const row = await this.rowRepo.findOne({ where: { id } });
    if (!row) {
      throw new NotFoundException('콘텐츠 행을 찾을 수 없습니다.');
    }

    this._checkAccess(row.coupleId, user);
    Object.assign(row, dto);
    return this.rowRepo.save(row);
  }

  async delete(id: string, user: { coupleId: string; role: string }): Promise<void> {
    const row = await this.rowRepo.findOne({ where: { id } });
    if (!row) {
      throw new NotFoundException('콘텐츠 행을 찾을 수 없습니다.');
    }

    this._checkAccess(row.coupleId, user);
    await this.rowRepo.remove(row);
  }

  private _checkAccess(coupleId: string, user: { coupleId: string; role: string }): void {
    if (user.role === WeddingUserRole.SUPER_ADMIN) return;
    if (user.coupleId !== coupleId) {
      throw new ForbiddenException('접근 권한이 없습니다.');
    }
  }
}
