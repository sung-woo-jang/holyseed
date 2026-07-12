import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WeddingAttendance, AttendanceStatus } from './entities/wedding-attendance.entity';
import { CreateAttendanceDto } from './dto/request/create-attendance.dto';
import { SearchAttendanceDto } from './dto/request/search-attendance.dto';
import { WeddingUserRole } from '../auth/entities/wedding-user.entity';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(WeddingAttendance)
    private readonly attendanceRepo: Repository<WeddingAttendance>,
  ) {}

  /**
   * RSVP 제출 (공개)
   */
  async create(dto: CreateAttendanceDto): Promise<WeddingAttendance> {
    const attendance = this.attendanceRepo.create(dto);
    return this.attendanceRepo.save(attendance);
  }

  /**
   * 참석 목록 + 통계 (관리자)
   */
  async search(dto: SearchAttendanceDto, user: { coupleId: string; role: string }) {
    this._checkAccess(dto.coupleId, user);

    const where: Partial<WeddingAttendance> = { coupleId: dto.coupleId };
    if (dto.attendanceStatus) {
      where.attendanceStatus = dto.attendanceStatus;
    }

    const [attendances, total] = await this.attendanceRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      take: dto.limit ?? 50,
      skip: dto.offset ?? 0,
    });

    const [attending, notAttending, maybe] = await Promise.all([
      this.attendanceRepo.count({ where: { coupleId: dto.coupleId, attendanceStatus: AttendanceStatus.ATTENDING } }),
      this.attendanceRepo.count({ where: { coupleId: dto.coupleId, attendanceStatus: AttendanceStatus.NOT_ATTENDING } }),
      this.attendanceRepo.count({ where: { coupleId: dto.coupleId, attendanceStatus: AttendanceStatus.MAYBE } }),
    ]);

    // 총 참석 인원 (guestCount 합산)
    const guestCountResult = await this.attendanceRepo
      .createQueryBuilder('a')
      .select('SUM(a.guest_count)', 'total')
      .where('a.couple_id = :coupleId AND a.attendance_status = :status', {
        coupleId: dto.coupleId,
        status: AttendanceStatus.ATTENDING,
      })
      .getRawOne();
    const totalGuests = parseInt(guestCountResult?.total ?? '0', 10);

    return {
      attendances,
      total,
      stats: {
        total: attending + notAttending + maybe,
        attending,
        notAttending,
        maybe,
        totalGuests,
      },
    };
  }

  /**
   * 참석 기록 삭제 (관리자)
   */
  async delete(id: string, user: { coupleId: string; role: string }): Promise<void> {
    const attendance = await this.attendanceRepo.findOne({ where: { id } });
    if (!attendance) {
      throw new NotFoundException('참석 기록을 찾을 수 없습니다.');
    }

    this._checkAccess(attendance.coupleId, user);
    await this.attendanceRepo.remove(attendance);
  }

  private _checkAccess(coupleId: string, user: { coupleId: string; role: string }): void {
    if (user.role === WeddingUserRole.SUPER_ADMIN) return;
    if (user.coupleId !== coupleId) {
      throw new ForbiddenException('접근 권한이 없습니다.');
    }
  }
}
