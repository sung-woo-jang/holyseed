import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WeddingGuestbook } from './entities/wedding-guestbook.entity';
import { CreateGuestbookDto } from './dto/request/create-guestbook.dto';
import { SearchGuestbookDto } from './dto/request/search-guestbook.dto';
import { WeddingUserRole } from '../auth/entities/wedding-user.entity';

@Injectable()
export class GuestbookService {
  constructor(
    @InjectRepository(WeddingGuestbook)
    private readonly guestbookRepo: Repository<WeddingGuestbook>,
  ) {}

  /**
   * 방명록 작성 (공개)
   */
  async create(dto: CreateGuestbookDto): Promise<WeddingGuestbook> {
    const entry = this.guestbookRepo.create(dto);
    return this.guestbookRepo.save(entry);
  }

  /**
   * 방명록 목록 조회 (공개)
   */
  async search(dto: SearchGuestbookDto) {
    const [entries, total] = await this.guestbookRepo.findAndCount({
      where: { coupleId: dto.coupleId },
      order: { createdAt: 'DESC' },
      take: dto.limit ?? 10,
      skip: dto.offset ?? 0,
    });

    return { entries, total };
  }

  /**
   * 방명록 삭제 (관리자)
   */
  async delete(id: string, user: { coupleId: string; role: string }): Promise<void> {
    const entry = await this.guestbookRepo.findOne({ where: { id } });
    if (!entry) {
      throw new NotFoundException('방명록을 찾을 수 없습니다.');
    }

    this._checkAccess(entry.coupleId, user);
    await this.guestbookRepo.remove(entry);
  }

  private _checkAccess(coupleId: string, user: { coupleId: string; role: string }): void {
    if (user.role === WeddingUserRole.SUPER_ADMIN) return;
    if (user.coupleId !== coupleId) {
      throw new ForbiddenException('접근 권한이 없습니다.');
    }
  }
}
