import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import moment from 'moment';
import { Reservation, ReservationStatus } from './entities';
import {
  CreateReservationDto,
  AvailableTimesDto,
  AvailableDatesDto,
  TimeType,
  ReservationsQueryDto,
} from './dto/request';
import {
  CreateReservationResponseDto,
  ReservationDetailDto,
  AvailableTimesResponseDto,
  AvailableDatesResponseDto,
  UnavailableDateDto,
  TimeSlotDto,
  MyReservationListResponseDto,
} from './dto/response';
import { ServicesService } from '@modules/services/services.service';
import { SettingsService } from '@modules/settings/settings.service';
import { FilesService } from '@modules/files/files.service';
import { OperatingType } from '@modules/settings/entities';
import { ScheduleMode } from '@modules/services/entities/service-schedule.entity';
import { ReservationCodeUtil } from '@common/utils/reservation-code.util';
import { ERROR_MESSAGES } from '@common/constants';

@Injectable()
export class ReservationsService {
  private readonly dayOfWeekMap = ['일', '월', '화', '수', '목', '금', '토'];
  private readonly dayCodeMap: Record<string, number> = {
    sun: 0,
    mon: 1,
    tue: 2,
    wed: 3,
    thu: 4,
    fri: 5,
    sat: 6,
  };

  constructor(
    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,
    private readonly servicesService: ServicesService,
    private readonly settingsService: SettingsService,
    private readonly filesService: FilesService,
  ) {}

  /**
   * 예약 생성
   */
  async create(
    dto: CreateReservationDto,
    photoFiles: Express.Multer.File[],
    customerId: number,
  ): Promise<CreateReservationResponseDto> {
    // 서비스 존재 확인
    const service = await this.servicesService.findById(
      parseInt(dto.serviceId),
    );
    if (!service || !service.isActive) {
      throw new BadRequestException(ERROR_MESSAGES.RESERVATION.INVALID_SERVICE);
    }

    // 파일 업로드 처리
    let photoUrls: string[] | null = null;
    if (photoFiles && photoFiles.length > 0) {
      try {
        const uploadResults = await Promise.all(
          photoFiles.map((file) =>
            this.filesService.uploadImage(file, 'reservations'),
          ),
        );
        photoUrls = uploadResults.map((result) => result.url);
      } catch (error) {
        throw new BadRequestException(`파일 업로드 실패: ${error.message}`);
      }
    }

    // 예약번호 생성
    const estimateDate = new Date(dto.estimateDate);
    const existingReservations = await this.reservationRepository.find({
      where: { estimateDate },
      select: ['reservationNumber'],
    });
    const nextSequence = ReservationCodeUtil.getNextSequence(
      estimateDate,
      existingReservations.map((r) => r.reservationNumber),
    );
    const reservationNumber = ReservationCodeUtil.generate(
      estimateDate,
      nextSequence,
    );

    // 예약 생성
    try {
      const reservation = this.reservationRepository.create({
        reservationNumber,
        customerId,
        serviceId: parseInt(dto.serviceId),
        estimateDate,
        estimateTime: dto.estimateTime,
        constructionDate: null, // 관리자가 나중에 지정
        constructionTime: null, // 관리자가 나중에 지정
        address: dto.address,
        detailAddress: dto.detailAddress,
        customerName: dto.customerName,
        customerPhone: dto.customerPhone,
        memo: dto.memo || null,
        photos: photoUrls,
        status: ReservationStatus.PENDING,
      });

      const saved = await this.reservationRepository.save(reservation);

      return {
        id: saved.id.toString(),
        reservationNumber: saved.reservationNumber,
        status: saved.status,
        createdAt: saved.createdAt.toISOString(),
      };
    } catch (error) {
      // 실패 시 업로드된 파일 롤백
      if (photoUrls && photoUrls.length > 0) {
        await this.cleanupUploadedFiles(photoUrls);
      }
      throw error;
    }
  }

  /**
   * 예약 상세 조회
   */
  async findById(
    id: number,
    customerId?: number,
  ): Promise<ReservationDetailDto> {
    const reservation = await this.reservationRepository.findOne({
      where: { id },
      relations: ['service'],
    });

    if (!reservation) {
      throw new NotFoundException(ERROR_MESSAGES.RESERVATION.NOT_FOUND);
    }

    // 고객 ID가 제공된 경우 본인 예약인지 확인
    if (customerId && reservation.customerId !== customerId) {
      throw new ForbiddenException(ERROR_MESSAGES.RESERVATION.FORBIDDEN_ACCESS);
    }

    return this.toReservationDetailDto(reservation);
  }

  /**
   * 예약 취소
   */
  async cancel(id: number, customerId: number): Promise<ReservationDetailDto> {
    const reservation = await this.reservationRepository.findOne({
      where: { id },
      relations: ['service'],
    });

    if (!reservation) {
      throw new NotFoundException(ERROR_MESSAGES.RESERVATION.NOT_FOUND);
    }

    if (reservation.customerId !== customerId) {
      throw new ForbiddenException(ERROR_MESSAGES.RESERVATION.FORBIDDEN_CANCEL);
    }

    if (reservation.status === ReservationStatus.CANCELLED) {
      throw new BadRequestException(
        ERROR_MESSAGES.RESERVATION.ALREADY_CANCELLED,
      );
    }

    if (reservation.status === ReservationStatus.COMPLETED) {
      throw new BadRequestException(
        ERROR_MESSAGES.RESERVATION.CANNOT_CANCEL_COMPLETED,
      );
    }

    reservation.status = ReservationStatus.CANCELLED;
    reservation.cancelledAt = new Date();

    const saved = await this.reservationRepository.save(reservation);

    return this.toReservationDetailDto(saved);
  }

  /**
   * 내 예약 목록 조회
   */
  async findMyReservations(
    customerId: number,
    query: ReservationsQueryDto,
  ): Promise<MyReservationListResponseDto> {
    const whereClause: any = { customerId };

    if (query.status) {
      whereClause.status = query.status;
    }

    const [items, total] = await this.reservationRepository.findAndCount({
      where: whereClause,
      relations: ['service'],
      order: { createdAt: 'DESC' },
      take: query.limit,
      skip: query.offset,
    });

    return {
      items: items.map((r) => ({
        id: r.id.toString(),
        reservationNumber: r.reservationNumber,
        service: {
          id: r.service.id.toString(),
          title: r.service.title,
        },
        estimateDate: this.formatDate(r.estimateDate),
        status: r.status,
        createdAt: r.createdAt.toISOString(),
      })),
      total,
    };
  }

  /**
   * 예약 가능 시간 조회
   */
  async getAvailableTimes(
    dto: AvailableTimesDto,
  ): Promise<AvailableTimesResponseDto> {
    const date = new Date(dto.date);
    const dayOfWeekIndex = date.getDay();
    const dayOfWeek = this.dayOfWeekMap[dayOfWeekIndex];
    const serviceId = parseInt(dto.serviceId);

    // 서비스별 스케줄 조회
    const serviceSchedule =
      await this.servicesService.getServiceSchedule(serviceId);

    // 예약 가능 기간 체크
    if (serviceSchedule) {
      const maxDate = moment()
        .add(serviceSchedule.bookingPeriodMonths, 'months')
        .endOf('day');
      if (moment(date).isAfter(maxDate)) {
        return {
          date: dto.date,
          dayOfWeek,
          isAvailable: false,
          times: [],
          defaultTime: '09:00',
          reason: `예약 가능 기간이 아닙니다. (${serviceSchedule.bookingPeriodMonths}개월 이내만 예약 가능)`,
        };
      }
    }

    // 전역 휴무일 체크
    const isGlobalHoliday = await this.settingsService.isHoliday(date);
    if (isGlobalHoliday) {
      return {
        date: dto.date,
        dayOfWeek,
        isAvailable: false,
        times: [],
        defaultTime: '09:00',
        reason: '휴무일입니다.',
      };
    }

    // 서비스별 휴무일 체크
    const serviceHolidays =
      await this.servicesService.getServiceHolidays(serviceId);
    const dateString = moment(date).format('YYYY-MM-DD');
    const serviceHoliday = serviceHolidays.find(
      (h) => moment(h.date).format('YYYY-MM-DD') === dateString,
    );
    if (serviceHoliday) {
      return {
        date: dto.date,
        dayOfWeek,
        isAvailable: false,
        times: [],
        defaultTime: '09:00',
        reason: serviceHoliday.reason || '서비스 휴무일입니다.',
      };
    }

    // 스케줄 모드에 따른 운영 설정 결정
    const operatingType =
      dto.type === TimeType.ESTIMATE
        ? OperatingType.ESTIMATE
        : OperatingType.CONSTRUCTION;

    // 서비스별 스케줄 모드 가져오기
    const scheduleMode =
      dto.type === TimeType.ESTIMATE
        ? serviceSchedule?.estimateScheduleMode
        : serviceSchedule?.constructionScheduleMode;

    // 기본 전역 설정
    const globalSetting =
      await this.settingsService.getOperatingSettingByType(operatingType);

    // 기본값 설정
    const defaultSetting = {
      availableDays:
        dto.type === TimeType.ESTIMATE
          ? ['mon', 'tue', 'wed', 'thu', 'fri']
          : ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
      startTime: dto.type === TimeType.ESTIMATE ? '18:00' : '09:00',
      endTime: dto.type === TimeType.ESTIMATE ? '22:00' : '18:00',
      slotDuration: 60,
    };

    // 스케줄 모드에 따른 설정 결정
    let config = globalSetting || defaultSetting;

    if (
      serviceSchedule &&
      scheduleMode &&
      scheduleMode !== ScheduleMode.GLOBAL
    ) {
      const serviceAvailableDays =
        dto.type === TimeType.ESTIMATE
          ? serviceSchedule.estimateAvailableDays
          : serviceSchedule.constructionAvailableDays;

      const serviceStartTime =
        dto.type === TimeType.ESTIMATE
          ? serviceSchedule.estimateStartTime
          : serviceSchedule.constructionStartTime;

      const serviceEndTime =
        dto.type === TimeType.ESTIMATE
          ? serviceSchedule.estimateEndTime
          : serviceSchedule.constructionEndTime;

      const serviceSlotDuration =
        dto.type === TimeType.ESTIMATE
          ? serviceSchedule.estimateSlotDuration
          : serviceSchedule.constructionSlotDuration;

      // 스케줄 모드에 따른 요일 계산
      let availableDays: string[];
      switch (scheduleMode) {
        case ScheduleMode.WEEKDAYS:
          availableDays = ['mon', 'tue', 'wed', 'thu', 'fri'];
          break;
        case ScheduleMode.WEEKENDS:
          availableDays = ['sat', 'sun'];
          break;
        case ScheduleMode.EVERYDAY:
          availableDays = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
          break;
        case ScheduleMode.CUSTOM:
          availableDays = serviceAvailableDays || config.availableDays;
          break;
        case ScheduleMode.EVERYDAY_EXCEPT:
          // 매일에서 특정 요일 제외
          const allDays = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
          const excludeDays = serviceAvailableDays || [];
          availableDays = allDays.filter((day) => !excludeDays.includes(day));
          break;
        default:
          availableDays = config.availableDays;
      }

      config = {
        availableDays,
        startTime: serviceStartTime || config.startTime,
        endTime: serviceEndTime || config.endTime,
        slotDuration: serviceSlotDuration || config.slotDuration,
      };
    }

    // 요일 체크
    const dayCode = Object.keys(this.dayCodeMap).find(
      (key) => this.dayCodeMap[key] === dayOfWeekIndex,
    );
    const isOperatingDay = config.availableDays.includes(dayCode || '');

    if (!isOperatingDay) {
      return {
        date: dto.date,
        dayOfWeek,
        isAvailable: false,
        times: [],
        defaultTime: config.startTime,
        reason: '해당 요일은 예약이 불가능합니다.',
      };
    }

    // 시간대 생성
    const times = this.generateTimeSlots(
      config.startTime,
      config.endTime,
      config.slotDuration,
    );

    // 해당 날짜의 기존 예약 조회
    const existingReservations = await this.reservationRepository.find({
      where:
        dto.type === TimeType.ESTIMATE
          ? { estimateDate: date }
          : { constructionDate: date },
      select:
        dto.type === TimeType.ESTIMATE
          ? ['estimateTime']
          : ['constructionTime'],
    });

    const bookedTimes = existingReservations.map((r) =>
      dto.type === TimeType.ESTIMATE ? r.estimateTime : r.constructionTime,
    );

    // 가능 여부 체크
    const timesWithAvailability: TimeSlotDto[] = times.map((time) => ({
      time,
      available: !bookedTimes.includes(time),
    }));

    return {
      date: dto.date,
      dayOfWeek,
      isAvailable: true,
      times: timesWithAvailability,
      defaultTime: config.startTime,
    };
  }

  /**
   * 시간대 생성
   */
  private generateTimeSlots(
    startTime: string,
    endTime: string,
    slotDuration: number,
  ): string[] {
    const slots: string[] = [];
    const start = moment(startTime, 'HH:mm');
    const end = moment(endTime, 'HH:mm');

    while (start.isBefore(end)) {
      slots.push(start.format('HH:mm'));
      start.add(slotDuration, 'minutes');
    }

    return slots;
  }

  /**
   * 예약 상태 변경 (관리자용)
   */
  async updateStatus(id: number, newStatus: ReservationStatus): Promise<ReservationDetailDto> {
    const reservation = await this.reservationRepository.findOne({
      where: { id },
      relations: ['service'],
    });

    if (!reservation) {
      throw new NotFoundException(ERROR_MESSAGES.RESERVATION.NOT_FOUND);
    }

    // 상태 전환 유효성 검사
    this.validateStatusTransition(reservation.status, newStatus);

    if (newStatus === ReservationStatus.CONFIRMED) {
      reservation.confirmedAt = new Date();
    }

    reservation.status = newStatus;
    const saved = await this.reservationRepository.save(reservation);

    return this.toReservationDetailDto(saved);
  }

  /**
   * 상태 전환 유효성 검사
   */
  private validateStatusTransition(
    currentStatus: ReservationStatus,
    newStatus: ReservationStatus,
  ): void {
    const validTransitions: Record<ReservationStatus, ReservationStatus[]> = {
      [ReservationStatus.PENDING]: [
        ReservationStatus.CONFIRMED,
        ReservationStatus.CANCELLED,
      ],
      [ReservationStatus.CONFIRMED]: [
        ReservationStatus.COMPLETED,
        ReservationStatus.CANCELLED,
      ],
      [ReservationStatus.COMPLETED]: [],
      [ReservationStatus.CANCELLED]: [],
    };

    const allowedTransitions = validTransitions[currentStatus];
    if (!allowedTransitions.includes(newStatus)) {
      throw new BadRequestException(
        `${currentStatus} 상태에서는 ${newStatus}로 변경할 수 없습니다.`,
      );
    }
  }

  /**
   * Reservation을 ReservationDetailDto로 변환
   */
  private toReservationDetailDto(
    reservation: Reservation,
  ): ReservationDetailDto {
    const canCancel =
      reservation.status !== ReservationStatus.CANCELLED &&
      reservation.status !== ReservationStatus.COMPLETED;

    const canReview = reservation.status === ReservationStatus.COMPLETED;

    return {
      id: reservation.id.toString(),
      reservationNumber: reservation.reservationNumber,
      service: {
        id: reservation.service.id.toString(),
        title: reservation.service.title,
      },
      estimateDate: this.formatDate(reservation.estimateDate),
      estimateTime: reservation.estimateTime,
      constructionDate: this.formatDate(reservation.constructionDate),
      constructionTime: reservation.constructionTime,
      address: reservation.address,
      detailAddress: reservation.detailAddress,
      customerName: reservation.customerName,
      customerPhone: reservation.customerPhone,
      status: reservation.status,
      canCancel,
      canReview,
      createdAt: reservation.createdAt.toISOString(),
    };
  }

  /**
   * Date를 YYYY-MM-DD 형식으로 변환
   */
  private formatDate(date: Date): string {
    return moment(date).format('YYYY-MM-DD');
  }

  /**
   * 월별 예약 가능 날짜 조회
   * 해당 월의 모든 날짜에 대해 예약 가능 여부를 반환합니다.
   */
  async getAvailableDates(
    dto: AvailableDatesDto,
  ): Promise<AvailableDatesResponseDto> {
    const { serviceId, year, month, type } = dto;

    // 서비스별 스케줄 조회
    const serviceSchedule =
      await this.servicesService.getServiceSchedule(serviceId);

    // 예약 가능 최대 날짜 계산 (기본 3개월)
    const bookingPeriodMonths = serviceSchedule?.bookingPeriodMonths || 3;
    const maxDate = moment()
      .add(bookingPeriodMonths, 'months')
      .endOf('day')
      .format('YYYY-MM-DD');

    // 전역 휴무일 목록 조회
    const globalHolidays = await this.settingsService.getHolidaysForMonth(
      year,
      month,
    );

    // 서비스별 휴무일 목록 조회
    const serviceHolidays =
      await this.servicesService.getServiceHolidays(serviceId);

    // 스케줄 모드에 따른 가능 요일 계산
    const operatingType =
      type === TimeType.ESTIMATE
        ? OperatingType.ESTIMATE
        : OperatingType.CONSTRUCTION;

    const scheduleMode =
      type === TimeType.ESTIMATE
        ? serviceSchedule?.estimateScheduleMode
        : serviceSchedule?.constructionScheduleMode;

    // 전역 설정 조회
    const globalSetting =
      await this.settingsService.getOperatingSettingByType(operatingType);

    // 기본값 설정
    const defaultAvailableDays =
      type === TimeType.ESTIMATE
        ? ['mon', 'tue', 'wed', 'thu', 'fri']
        : ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

    // 가능 요일 계산
    let availableDays: string[] =
      globalSetting?.availableDays || defaultAvailableDays;

    if (
      serviceSchedule &&
      scheduleMode &&
      scheduleMode !== ScheduleMode.GLOBAL
    ) {
      const serviceAvailableDays =
        type === TimeType.ESTIMATE
          ? serviceSchedule.estimateAvailableDays
          : serviceSchedule.constructionAvailableDays;

      switch (scheduleMode) {
        case ScheduleMode.WEEKDAYS:
          availableDays = ['mon', 'tue', 'wed', 'thu', 'fri'];
          break;
        case ScheduleMode.WEEKENDS:
          availableDays = ['sat', 'sun'];
          break;
        case ScheduleMode.EVERYDAY:
          availableDays = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
          break;
        case ScheduleMode.CUSTOM:
          availableDays = serviceAvailableDays || availableDays;
          break;
        case ScheduleMode.EVERYDAY_EXCEPT:
          const allDays = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
          const excludeDays = serviceAvailableDays || [];
          availableDays = allDays.filter((day) => !excludeDays.includes(day));
          break;
      }
    }

    // 해당 월의 첫날과 마지막 날 계산
    const firstDay = moment({ year, month: month - 1, day: 1 });
    const lastDay = moment({ year, month: month - 1 }).endOf('month');

    // 예약 불가능한 날짜 목록 생성
    const unavailableDates: UnavailableDateDto[] = [];
    const today = moment().startOf('day');

    const current = firstDay.clone();
    while (current.isSameOrBefore(lastDay)) {
      const dateString = current.format('YYYY-MM-DD');
      const dayOfWeekIndex = current.day();
      const dayCode = Object.keys(this.dayCodeMap).find(
        (key) => this.dayCodeMap[key] === dayOfWeekIndex,
      );

      let reason: string | null = null;

      // 1. 과거 날짜 체크
      if (current.isBefore(today)) {
        reason = '과거 날짜는 예약할 수 없습니다.';
      }
      // 2. 예약 가능 기간 체크
      else if (current.isAfter(moment(maxDate))) {
        reason = `예약 가능 기간이 아닙니다. (${bookingPeriodMonths}개월 이내만 예약 가능)`;
      }
      // 3. 전역 휴무일 체크
      else if (
        globalHolidays.some(
          (h) => moment(h.date).format('YYYY-MM-DD') === dateString,
        )
      ) {
        const holiday = globalHolidays.find(
          (h) => moment(h.date).format('YYYY-MM-DD') === dateString,
        );
        reason = holiday?.reason || '휴무일입니다.';
      }
      // 4. 서비스별 휴무일 체크
      else if (
        serviceHolidays.some(
          (h) => moment(h.date).format('YYYY-MM-DD') === dateString,
        )
      ) {
        const holiday = serviceHolidays.find(
          (h) => moment(h.date).format('YYYY-MM-DD') === dateString,
        );
        reason = holiday?.reason || '서비스 휴무일입니다.';
      }
      // 5. 운영 요일 체크
      else if (!availableDays.includes(dayCode || '')) {
        reason = '해당 요일은 예약이 불가능합니다.';
      }

      if (reason) {
        unavailableDates.push({ date: dateString, reason });
      }

      current.add(1, 'day');
    }

    return {
      year,
      month,
      unavailableDates,
      maxDate,
    };
  }

  /**
   * 업로드된 파일 정리 (롤백용)
   */
  private async cleanupUploadedFiles(urls: string[]): Promise<void> {
    try {
      await Promise.all(
        urls.map((url) => {
          const s3Key = this.filesService.getFilePathFromUrl(url);
          return this.filesService.deleteFile(s3Key);
        }),
      );
    } catch (error) {
      console.error('파일 정리 중 오류 발생:', error);
      // 에러를 던지지 않음 (메인 트랜잭션 실패가 더 중요)
    }
  }
}
