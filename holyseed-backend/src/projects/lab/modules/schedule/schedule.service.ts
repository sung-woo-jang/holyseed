import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Schedule } from './entities';
import { CreateScheduleDto, UpdateScheduleDto, SearchScheduleDto } from './dto/request';

@Injectable()
export class ScheduleService {
  constructor(
    @InjectRepository(Schedule)
    private readonly scheduleRepo: Repository<Schedule>,
  ) {}

  async findAll(): Promise<Schedule[]> {
    return this.scheduleRepo.find({ order: { startAt: 'ASC' } });
  }

  /** 기간 겹침 조회: startAt ≤ to AND (endAt ?? startAt) ≥ from */
  async search(dto: SearchScheduleDto): Promise<Schedule[]> {
    return this.scheduleRepo
      .createQueryBuilder('s')
      .where('s.start_at <= :to', { to: dto.to })
      .andWhere('COALESCE(s.end_at, s.start_at) >= :from', { from: dto.from })
      .orderBy('s.start_at', 'ASC')
      .getMany();
  }

  async create(dto: CreateScheduleDto): Promise<Schedule> {
    const schedule = this.scheduleRepo.create({
      ...dto,
      endAt: dto.endAt ? new Date(dto.endAt) : null,
      startAt: new Date(dto.startAt),
      allDay: dto.allDay ?? true,
      tags: dto.tags ?? [],
    });
    return this.scheduleRepo.save(schedule);
  }

  async update(id: number, dto: UpdateScheduleDto): Promise<Schedule> {
    const schedule = await this.scheduleRepo.findOne({ where: { id } });
    if (!schedule) throw new NotFoundException('일정을 찾을 수 없습니다.');

    const { startAt, endAt, ...rest } = dto;
    Object.assign(schedule, rest);
    if (startAt !== undefined) schedule.startAt = new Date(startAt);
    if (endAt !== undefined) schedule.endAt = endAt ? new Date(endAt) : null;
    return this.scheduleRepo.save(schedule);
  }

  async delete(id: number): Promise<void> {
    const schedule = await this.scheduleRepo.findOne({ where: { id } });
    if (!schedule) throw new NotFoundException('일정을 찾을 수 없습니다.');
    await this.scheduleRepo.remove(schedule);
  }
}
