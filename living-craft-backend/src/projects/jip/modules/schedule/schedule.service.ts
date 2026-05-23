import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { TechSchedule, SlotStatus } from './entities/tech-schedule.entity';

function ymd(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

@Injectable()
export class ScheduleService {
  constructor(
    @InjectRepository(TechSchedule) private readonly schedRepo: Repository<TechSchedule>,
  ) {}

  async getRange(from: string, to: string) {
    return this.schedRepo.find({
      where: { date: Between(from, to) },
      order: { date: 'ASC' },
    });
  }

  async get60Days() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(today);
    end.setDate(today.getDate() + 60);
    const rows = await this.getRange(ymd(today), ymd(end));

    // 없는 날짜는 buildSchedule 로직으로 채워 반환
    const map = new Map(rows.map((r) => [r.date, r]));
    const result: Record<string, { am: SlotStatus; noon: SlotStatus; pm: SlotStatus; eve: SlotStatus }> = {};

    for (let i = 0; i < 60; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const key = ymd(d);
      if (map.has(key)) {
        const r = map.get(key)!;
        result[key] = { am: r.am, noon: r.noon, pm: r.pm, eve: r.eve };
      } else {
        result[key] = this.defaultSlots(d);
      }
    }
    return result;
  }

  private defaultSlots(d: Date): { am: SlotStatus; noon: SlotStatus; pm: SlotStatus; eve: SlotStatus } {
    const day = d.getDay();
    const off: SlotStatus = 'off';
    const open: SlotStatus = 'open';
    if (day === 0) return { am: off, noon: off, pm: off, eve: off };
    return {
      am: open,
      noon: open,
      pm: day === 6 ? off : open,
      eve: day === 5 || day === 6 ? open : off,
    };
  }

  async updateSlot(date: string, slot: 'am' | 'noon' | 'pm' | 'eve', status: SlotStatus, note?: string) {
    let row = await this.schedRepo.findOne({ where: { date } });
    if (!row) {
      const d = new Date(date + 'T00:00:00');
      const defaults = this.defaultSlots(d);
      row = this.schedRepo.create({ date, ...defaults });
    }
    row[slot] = status;
    if (note !== undefined) row.note = note;
    return this.schedRepo.save(row);
  }

  async updateDay(date: string, slots: { am?: SlotStatus; noon?: SlotStatus; pm?: SlotStatus; eve?: SlotStatus }, note?: string) {
    let row = await this.schedRepo.findOne({ where: { date } });
    if (!row) {
      const d = new Date(date + 'T00:00:00');
      const defaults = this.defaultSlots(d);
      row = this.schedRepo.create({ date, ...defaults });
    }
    if (slots.am !== undefined) row.am = slots.am;
    if (slots.noon !== undefined) row.noon = slots.noon;
    if (slots.pm !== undefined) row.pm = slots.pm;
    if (slots.eve !== undefined) row.eve = slots.eve;
    if (note !== undefined) row.note = note;
    return this.schedRepo.save(row);
  }
}
