import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, Between } from 'typeorm';
import { OperatingSetting, OperatingType, Holiday } from './entities';
import { UpdateOperatingHoursDto, AddHolidayDto } from './dto/request';
import { OperatingHoursResponseDto } from './dto/response';
import { ERROR_MESSAGES } from '@common/constants';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(OperatingSetting)
    private readonly operatingSettingRepository: Repository<OperatingSetting>,
    @InjectRepository(Holiday)
    private readonly holidayRepository: Repository<Holiday>,
  ) {}

  /**
   * 운영 시간 조회
   */
  async getOperatingHours(): Promise<OperatingHoursResponseDto> {
    const [estimate, construction, holidays] = await Promise.all([
      this.operatingSettingRepository.findOne({
        where: { type: OperatingType.ESTIMATE },
      }),
      this.operatingSettingRepository.findOne({
        where: { type: OperatingType.CONSTRUCTION },
      }),
      this.holidayRepository.find({
        where: { date: MoreThanOrEqual(new Date()) },
        order: { date: 'ASC' },
      }),
    ]);

    // 기본값 설정 (데이터가 없는 경우)
    const defaultEstimate = {
      availableDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
      startTime: '18:00',
      endTime: '22:00',
      slotDuration: 60,
    };

    const defaultConstruction = {
      availableDays: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
      startTime: '09:00',
      endTime: '18:00',
      slotDuration: 60,
    };

    return {
      estimate: estimate
        ? {
            availableDays: estimate.availableDays,
            startTime: estimate.startTime,
            endTime: estimate.endTime,
            slotDuration: estimate.slotDuration,
          }
        : defaultEstimate,
      construction: construction
        ? {
            availableDays: construction.availableDays,
            startTime: construction.startTime,
            endTime: construction.endTime,
            slotDuration: construction.slotDuration,
          }
        : defaultConstruction,
      holidays: holidays.map((h) => this.formatDate(h.date)),
    };
  }

  /**
   * 운영 시간 수정
   */
  async updateOperatingHours(
    dto: UpdateOperatingHoursDto,
  ): Promise<OperatingHoursResponseDto> {
    // 견적 설정 저장/업데이트
    await this.upsertOperatingSetting(OperatingType.ESTIMATE, dto.estimate);

    // 시공 설정 저장/업데이트
    await this.upsertOperatingSetting(
      OperatingType.CONSTRUCTION,
      dto.construction,
    );

    return this.getOperatingHours();
  }

  /**
   * 운영 설정 저장/업데이트
   */
  private async upsertOperatingSetting(
    type: OperatingType,
    config: { availableDays: string[]; startTime: string; endTime: string },
  ): Promise<void> {
    let setting = await this.operatingSettingRepository.findOne({
      where: { type },
    });

    if (setting) {
      setting.availableDays = config.availableDays;
      setting.startTime = config.startTime;
      setting.endTime = config.endTime;
    } else {
      setting = this.operatingSettingRepository.create({
        type,
        availableDays: config.availableDays,
        startTime: config.startTime,
        endTime: config.endTime,
        slotDuration: 60,
      });
    }

    await this.operatingSettingRepository.save(setting);
  }

  /**
   * 휴무일 추가
   */
  async addHoliday(dto: AddHolidayDto): Promise<string[]> {
    const dateObj = new Date(dto.date);

    // 이미 등록된 휴무일인지 확인
    const existing = await this.holidayRepository.findOne({
      where: { date: dateObj },
    });

    if (existing) {
      throw new BadRequestException(
        ERROR_MESSAGES.SETTINGS.HOLIDAY_ALREADY_EXISTS,
      );
    }

    const holiday = this.holidayRepository.create({
      date: dateObj,
      reason: dto.reason,
    });

    await this.holidayRepository.save(holiday);

    // 갱신된 휴무일 목록 반환
    const holidays = await this.holidayRepository.find({
      where: { date: MoreThanOrEqual(new Date()) },
      order: { date: 'ASC' },
    });

    return holidays.map((h) => this.formatDate(h.date));
  }

  /**
   * 휴무일 삭제
   */
  async deleteHoliday(dateString: string): Promise<string[]> {
    const dateObj = new Date(dateString);

    const holiday = await this.holidayRepository.findOne({
      where: { date: dateObj },
    });

    if (!holiday) {
      throw new NotFoundException(ERROR_MESSAGES.SETTINGS.HOLIDAY_NOT_FOUND);
    }

    await this.holidayRepository.remove(holiday);

    // 갱신된 휴무일 목록 반환
    const holidays = await this.holidayRepository.find({
      where: { date: MoreThanOrEqual(new Date()) },
      order: { date: 'ASC' },
    });

    return holidays.map((h) => this.formatDate(h.date));
  }

  /**
   * 특정 날짜가 휴무일인지 확인
   */
  async isHoliday(date: Date): Promise<boolean> {
    const holiday = await this.holidayRepository.findOne({
      where: { date },
    });
    return !!holiday;
  }

  /**
   * 운영 설정 조회 (타입별)
   */
  async getOperatingSettingByType(
    type: OperatingType,
  ): Promise<OperatingSetting | null> {
    return this.operatingSettingRepository.findOne({
      where: { type },
    });
  }

  /**
   * 특정 월의 휴무일 목록 조회
   */
  async getHolidaysForMonth(year: number, month: number): Promise<Holiday[]> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // 해당 월의 마지막 날

    return this.holidayRepository.find({
      where: {
        date: Between(startDate, endDate),
      },
      order: { date: 'ASC' },
    });
  }

  /**
   * Date를 YYYY-MM-DD 형식으로 변환
   */
  private formatDate(date: Date | string): string {
    if (typeof date === 'string') {
      return date.split('T')[0];
    }
    return date.toISOString().split('T')[0];
  }
}
