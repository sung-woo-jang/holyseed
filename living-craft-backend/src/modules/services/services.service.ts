import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  Service,
  ServiceHoliday,
  ServiceRegion,
  ServiceSchedule,
} from './entities';
import {
  CityDto,
  CreateServiceDto,
  ServiceableRegionDto,
  ServiceDetailDto,
  ServiceHolidayInputDto,
  ServiceListItemDto,
  ServiceScheduleInputDto,
  UpdateServiceDto,
  ServiceAdminListItemDto,
  ServiceAdminDetailDto,
  ServiceRegionAdminDto,
  ServiceScheduleAdminDto,
} from './dto';
import { District } from '@modules/admin/districts/entities/district.entity';
import { DistrictLevel } from '@common/enums/district-level.enum';
import { Icon } from '@modules/icons/entities/icon.entity';
import { IconType } from '@modules/icons/enums/icon-type.enum';
import { ERROR_MESSAGES } from '@common/constants';
import { ScheduleMode } from './entities/service-schedule.entity';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    @InjectRepository(ServiceRegion)
    private readonly serviceRegionRepository: Repository<ServiceRegion>,
    @InjectRepository(ServiceSchedule)
    private readonly serviceScheduleRepository: Repository<ServiceSchedule>,
    @InjectRepository(ServiceHoliday)
    private readonly serviceHolidayRepository: Repository<ServiceHoliday>,
    @InjectRepository(District)
    private readonly districtRepository: Repository<District>,
    @InjectRepository(Icon)
    private readonly iconRepository: Repository<Icon>,
  ) {}

  /**
   * 서비스 목록 조회 (지역 정보 포함)
   */
  async findAll(): Promise<ServiceListItemDto[]> {
    // 활성화된 서비스만 조회
    const services = await this.serviceRepository.find({
      where: { isActive: true },
      relations: ['serviceRegions', 'serviceRegions.district'],
      order: { sortOrder: 'ASC', id: 'ASC' },
    });

    return Promise.all(
      services.map(async (service) => this.toServiceListItemDto(service)),
    );
  }

  /**
   * ID로 서비스 조회
   */
  async findById(id: number): Promise<Service | null> {
    return this.serviceRepository.findOne({
      where: { id },
      relations: ['serviceRegions', 'serviceRegions.district'],
    });
  }

  /**
   * [관리자] 서비스 목록 조회 (간소화된 응답)
   * 테이블 표시에 필요한 최소 정보만 반환
   */
  async findAllForAdmin(): Promise<ServiceAdminListItemDto[]> {
    const services = await this.serviceRepository.find({
      relations: ['icon', 'serviceRegions'],
      order: { sortOrder: 'ASC', id: 'ASC' },
    });

    return services.map((service) => this.toAdminListItemDto(service));
  }

  /**
   * [관리자] 서비스 상세 조회 (수정 페이지용)
   */
  async findByIdForAdmin(id: number): Promise<ServiceAdminDetailDto> {
    const service = await this.serviceRepository.findOne({
      where: { id },
      relations: [
        'icon',
        'serviceRegions',
        'serviceRegions.district',
        'serviceRegions.district.parent',
        'schedule',
      ],
    });

    if (!service) {
      throw new NotFoundException(ERROR_MESSAGES.SERVICE.NOT_FOUND);
    }

    return this.toAdminDetailDto(service);
  }

  /**
   * Service 엔티티를 ServiceAdminListItemDto로 변환
   */
  private toAdminListItemDto(service: Service): ServiceAdminListItemDto {
    return {
      id: service.id,
      title: service.title,
      description: service.description,
      iconName: service.icon?.name ?? '',
      iconBgColor: service.iconBgColor,
      iconColor: service.iconColor,
      duration: service.duration,
      requiresTimeSelection: service.requiresTimeSelection,
      isActive: service.isActive,
      sortOrder: service.sortOrder,
      regionsCount: service.serviceRegions?.length ?? 0,
      createdAt: service.createdAt.toISOString(),
      updatedAt: service.updatedAt.toISOString(),
    };
  }

  /**
   * Service 엔티티를 ServiceAdminDetailDto로 변환
   */
  private toAdminDetailDto(service: Service): ServiceAdminDetailDto {
    // 지역 정보 변환 (원본 형태 유지)
    const regions: ServiceRegionAdminDto[] = (service.serviceRegions ?? []).map(
      (sr) => ({
        districtId: sr.districtId,
        districtFullName: sr.district?.fullName ?? '',
        districtName: sr.district?.name ?? '',
        estimateFee: Number(sr.estimateFee),
      }),
    );

    // 스케줄 정보 변환
    let schedule: ServiceScheduleAdminDto | null = null;
    if (service.schedule) {
      schedule = {
        estimateScheduleMode: service.schedule.estimateScheduleMode,
        estimateAvailableDays: service.schedule.estimateAvailableDays,
        estimateStartTime: service.schedule.estimateStartTime,
        estimateEndTime: service.schedule.estimateEndTime,
        estimateSlotDuration: service.schedule.estimateSlotDuration,
        constructionScheduleMode: service.schedule.constructionScheduleMode,
        constructionAvailableDays: service.schedule.constructionAvailableDays,
        constructionStartTime: service.schedule.constructionStartTime,
        constructionEndTime: service.schedule.constructionEndTime,
        constructionSlotDuration: service.schedule.constructionSlotDuration,
        bookingPeriodMonths: service.schedule.bookingPeriodMonths,
      };
    }

    return {
      id: service.id,
      title: service.title,
      description: service.description,
      icon: service.icon
        ? {
            id: service.icon.id,
            name: service.icon.name,
            type: service.icon.type,
            createdAt: service.icon.createdAt,
          }
        : { id: 0, name: '', type: IconType.FILL, createdAt: new Date() },
      iconBgColor: service.iconBgColor,
      iconColor: service.iconColor,
      duration: service.duration,
      requiresTimeSelection: service.requiresTimeSelection,
      isActive: service.isActive,
      sortOrder: service.sortOrder,
      regions,
      schedule,
      createdAt: service.createdAt.toISOString(),
      updatedAt: service.updatedAt.toISOString(),
    };
  }

  /**
   * 서비스 생성 (트랜잭션)
   */
  async create(dto: CreateServiceDto): Promise<Service> {
    // Icon 유효성 검증
    const icon = await this.iconRepository.findOne({
      where: { id: dto.iconId },
    });
    if (!icon) {
      throw new BadRequestException(ERROR_MESSAGES.SERVICE.INVALID_ICON_ID);
    }

    return this.serviceRepository.manager.transaction(async (manager) => {
      // 1. Service 엔티티 생성
      const service = manager.create(Service, {
        title: dto.title,
        description: dto.description,
        iconId: dto.iconId,
        iconBgColor: dto.iconBgColor,
        iconColor: dto.iconColor,
        duration: dto.duration,
        requiresTimeSelection: dto.requiresTimeSelection,
        sortOrder: dto.sortOrder ?? 0,
        isActive: true,
      });

      const savedService = await manager.save(Service, service);

      // 2. ServiceRegion 엔티티 bulk insert
      const serviceRegions = dto.regions.map((region) =>
        manager.create(ServiceRegion, {
          serviceId: savedService.id,
          districtId: region.districtId,
          estimateFee: region.estimateFee,
        }),
      );

      await manager.save(ServiceRegion, serviceRegions);

      // 3. ServiceSchedule 생성 (있는 경우)
      if (dto.schedule) {
        const schedule = manager.create(ServiceSchedule, {
          serviceId: savedService.id,
          estimateScheduleMode:
            dto.schedule.estimateScheduleMode ?? ScheduleMode.GLOBAL,
          // 빈 배열은 TypeORM simple-array에서 문제를 일으키므로 null로 변환
          estimateAvailableDays: dto.schedule.estimateAvailableDays?.length
            ? dto.schedule.estimateAvailableDays
            : null,
          estimateStartTime: dto.schedule.estimateStartTime ?? null,
          estimateEndTime: dto.schedule.estimateEndTime ?? null,
          estimateSlotDuration: dto.schedule.estimateSlotDuration ?? null,
          constructionScheduleMode:
            dto.schedule.constructionScheduleMode ?? ScheduleMode.GLOBAL,
          // 빈 배열은 TypeORM simple-array에서 문제를 일으키므로 null로 변환
          constructionAvailableDays: dto.schedule.constructionAvailableDays
            ?.length
            ? dto.schedule.constructionAvailableDays
            : null,
          constructionStartTime: dto.schedule.constructionStartTime ?? null,
          constructionEndTime: dto.schedule.constructionEndTime ?? null,
          constructionSlotDuration:
            dto.schedule.constructionSlotDuration ?? null,
          bookingPeriodMonths: dto.schedule.bookingPeriodMonths ?? 3,
        });

        await manager.save(ServiceSchedule, schedule);
      }

      // 4. Relations과 함께 다시 조회
      return manager.findOne(Service, {
        where: { id: savedService.id },
        relations: [
          'serviceRegions',
          'serviceRegions.district',
          'schedule',
          'holidays',
        ],
      });
    });
  }

  /**
   * 서비스 수정 (트랜잭션)
   */
  async update(id: number, dto: UpdateServiceDto): Promise<Service> {
    // Icon ID가 변경되는 경우 유효성 검증
    if (dto.iconId !== undefined) {
      const icon = await this.iconRepository.findOne({
        where: { id: dto.iconId },
      });
      if (!icon) {
        throw new BadRequestException(ERROR_MESSAGES.SERVICE.INVALID_ICON_ID);
      }
    }

    return this.serviceRepository.manager.transaction(async (manager) => {
      const service = await manager.findOne(Service, { where: { id } });
      if (!service) {
        throw new NotFoundException(ERROR_MESSAGES.SERVICE.NOT_FOUND);
      }

      // Service 필드 업데이트 (필드가 있는 것만)
      const updateData: Partial<Service> = {};
      if (dto.title !== undefined) updateData.title = dto.title;
      if (dto.description !== undefined)
        updateData.description = dto.description;
      if (dto.iconId !== undefined) updateData.iconId = dto.iconId;
      if (dto.iconBgColor !== undefined)
        updateData.iconBgColor = dto.iconBgColor;
      if (dto.iconColor !== undefined)
        updateData.iconColor = dto.iconColor;
      if (dto.duration !== undefined) updateData.duration = dto.duration;
      if (dto.requiresTimeSelection !== undefined)
        updateData.requiresTimeSelection = dto.requiresTimeSelection;
      if (dto.sortOrder !== undefined) updateData.sortOrder = dto.sortOrder;

      if (Object.keys(updateData).length > 0) {
        await manager.update(Service, { id }, updateData);
      }

      // ServiceRegion 업데이트 (전체 교체)
      if (dto.regions && dto.regions.length > 0) {
        // 기존 지역 정보 삭제
        await manager.delete(ServiceRegion, { serviceId: id });

        // 새로운 지역 정보 삽입
        const serviceRegions = dto.regions.map((region) =>
          manager.create(ServiceRegion, {
            serviceId: id,
            districtId: region.districtId,
            estimateFee: region.estimateFee,
          }),
        );

        await manager.save(ServiceRegion, serviceRegions);
      }

      // ServiceSchedule 업데이트 (있는 경우)
      if (dto.schedule !== undefined) {
        // 기존 스케줄 조회
        const existingSchedule = await manager.findOne(ServiceSchedule, {
          where: { serviceId: id },
        });

        // 빈 배열을 null로 변환하는 헬퍼
        const normalizeAvailableDays = (
          days: string[] | undefined,
          fallback: string[] | null,
        ): string[] | null => {
          if (days === undefined) return fallback;
          return days?.length ? days : null;
        };

        if (existingSchedule) {
          // 기존 스케줄 업데이트
          await manager.update(
            ServiceSchedule,
            { serviceId: id },
            {
              estimateScheduleMode:
                dto.schedule.estimateScheduleMode ??
                existingSchedule.estimateScheduleMode,
              estimateAvailableDays: normalizeAvailableDays(
                dto.schedule.estimateAvailableDays,
                existingSchedule.estimateAvailableDays,
              ),
              estimateStartTime:
                dto.schedule.estimateStartTime ??
                existingSchedule.estimateStartTime,
              estimateEndTime:
                dto.schedule.estimateEndTime ??
                existingSchedule.estimateEndTime,
              estimateSlotDuration:
                dto.schedule.estimateSlotDuration ??
                existingSchedule.estimateSlotDuration,
              constructionScheduleMode:
                dto.schedule.constructionScheduleMode ??
                existingSchedule.constructionScheduleMode,
              constructionAvailableDays: normalizeAvailableDays(
                dto.schedule.constructionAvailableDays,
                existingSchedule.constructionAvailableDays,
              ),
              constructionStartTime:
                dto.schedule.constructionStartTime ??
                existingSchedule.constructionStartTime,
              constructionEndTime:
                dto.schedule.constructionEndTime ??
                existingSchedule.constructionEndTime,
              constructionSlotDuration:
                dto.schedule.constructionSlotDuration ??
                existingSchedule.constructionSlotDuration,
              bookingPeriodMonths:
                dto.schedule.bookingPeriodMonths ??
                existingSchedule.bookingPeriodMonths,
            },
          );
        } else {
          // 새로운 스케줄 생성
          const schedule = manager.create(ServiceSchedule, {
            serviceId: id,
            estimateScheduleMode:
              dto.schedule.estimateScheduleMode ?? ScheduleMode.GLOBAL,
            // 빈 배열은 TypeORM simple-array에서 문제를 일으키므로 null로 변환
            estimateAvailableDays: dto.schedule.estimateAvailableDays?.length
              ? dto.schedule.estimateAvailableDays
              : null,
            estimateStartTime: dto.schedule.estimateStartTime ?? null,
            estimateEndTime: dto.schedule.estimateEndTime ?? null,
            estimateSlotDuration: dto.schedule.estimateSlotDuration ?? null,
            constructionScheduleMode:
              dto.schedule.constructionScheduleMode ?? ScheduleMode.GLOBAL,
            // 빈 배열은 TypeORM simple-array에서 문제를 일으키므로 null로 변환
            constructionAvailableDays: dto.schedule.constructionAvailableDays
              ?.length
              ? dto.schedule.constructionAvailableDays
              : null,
            constructionStartTime: dto.schedule.constructionStartTime ?? null,
            constructionEndTime: dto.schedule.constructionEndTime ?? null,
            constructionSlotDuration:
              dto.schedule.constructionSlotDuration ?? null,
            bookingPeriodMonths: dto.schedule.bookingPeriodMonths ?? 3,
          });

          await manager.save(ServiceSchedule, schedule);
        }
      }

      // Relations과 함께 다시 조회
      return manager.findOne(Service, {
        where: { id },
        relations: [
          'serviceRegions',
          'serviceRegions.district',
          'schedule',
          'holidays',
        ],
      });
    });
  }

  /**
   * 서비스 삭제 (Soft Delete)
   */
  async delete(id: number): Promise<{ deleted: boolean }> {
    const service = await this.serviceRepository.findOne({ where: { id } });
    if (!service) {
      throw new NotFoundException(ERROR_MESSAGES.SERVICE.NOT_FOUND);
    }

    await this.serviceRepository.update({ id }, { isActive: false });
    return { deleted: true };
  }

  /**
   * 서비스 활성/비활성 전환
   */
  async toggle(id: number): Promise<Service> {
    const service = await this.serviceRepository.findOne({ where: { id } });
    if (!service) {
      throw new NotFoundException(ERROR_MESSAGES.SERVICE.NOT_FOUND);
    }

    await this.serviceRepository.update(
      { id },
      { isActive: !service.isActive },
    );

    return this.findById(id);
  }

  /**
   * Service 엔티티를 ServiceDetailDto로 변환
   */
  async toServiceDetailDto(service: Service): Promise<ServiceDetailDto> {
    const serviceableRegions = await this.groupRegionsBySido(
      service.serviceRegions,
    );

    return {
      id: service.id.toString(),
      title: service.title,
      description: service.description,
      icon: {
        id: service.icon.id,
        name: service.icon.name,
        type: service.icon.type,
        createdAt: service.icon.createdAt,
      },
      iconBgColor: service.iconBgColor,
      iconColor: service.iconColor,
      duration: service.duration,
      requiresTimeSelection: service.requiresTimeSelection,
      isActive: service.isActive,
      sortOrder: service.sortOrder,
      serviceableRegions,
      createdAt: service.createdAt.toISOString(),
      updatedAt: service.updatedAt.toISOString(),
    };
  }

  /**
   * 서비스 휴무일 목록 조회
   */
  async getServiceHolidays(serviceId: number): Promise<ServiceHoliday[]> {
    const service = await this.serviceRepository.findOne({
      where: { id: serviceId },
    });
    if (!service) {
      throw new NotFoundException(ERROR_MESSAGES.SERVICE.NOT_FOUND);
    }

    return this.serviceHolidayRepository.find({
      where: { serviceId },
      order: { date: 'ASC' },
    });
  }

  /**
   * 서비스 휴무일 추가
   */
  async addServiceHolidays(
    serviceId: number,
    holidays: ServiceHolidayInputDto[],
  ): Promise<ServiceHoliday[]> {
    const service = await this.serviceRepository.findOne({
      where: { id: serviceId },
    });
    if (!service) {
      throw new NotFoundException(ERROR_MESSAGES.SERVICE.NOT_FOUND);
    }

    const newHolidays = holidays.map((holiday) =>
      this.serviceHolidayRepository.create({
        serviceId,
        date: new Date(holiday.date),
        reason: holiday.reason,
      }),
    );

    return this.serviceHolidayRepository.save(newHolidays);
  }

  // ===== 서비스 휴무일 관련 메서드 =====

  /**
   * 서비스 휴무일 삭제
   */
  async deleteServiceHolidays(
    serviceId: number,
    holidayIds: number[],
  ): Promise<{ deleted: number }> {
    const service = await this.serviceRepository.findOne({
      where: { id: serviceId },
    });
    if (!service) {
      throw new NotFoundException(ERROR_MESSAGES.SERVICE.NOT_FOUND);
    }

    const result = await this.serviceHolidayRepository.delete({
      id: In(holidayIds),
      serviceId,
    });

    return { deleted: result.affected ?? 0 };
  }

  /**
   * 서비스 스케줄 조회
   */
  async getServiceSchedule(serviceId: number): Promise<ServiceSchedule | null> {
    const service = await this.serviceRepository.findOne({
      where: { id: serviceId },
    });
    if (!service) {
      throw new NotFoundException(ERROR_MESSAGES.SERVICE.NOT_FOUND);
    }

    return this.serviceScheduleRepository.findOne({
      where: { serviceId },
    });
  }

  /**
   * 서비스 스케줄 업데이트
   */
  async updateServiceSchedule(
    serviceId: number,
    dto: ServiceScheduleInputDto,
  ): Promise<ServiceSchedule> {
    const service = await this.serviceRepository.findOne({
      where: { id: serviceId },
    });
    if (!service) {
      throw new NotFoundException(ERROR_MESSAGES.SERVICE.NOT_FOUND);
    }

    let schedule = await this.serviceScheduleRepository.findOne({
      where: { serviceId },
    });

    if (schedule) {
      // 기존 스케줄 업데이트
      Object.assign(schedule, {
        estimateScheduleMode:
          dto.estimateScheduleMode ?? schedule.estimateScheduleMode,
        estimateAvailableDays:
          dto.estimateAvailableDays ?? schedule.estimateAvailableDays,
        estimateStartTime: dto.estimateStartTime ?? schedule.estimateStartTime,
        estimateEndTime: dto.estimateEndTime ?? schedule.estimateEndTime,
        estimateSlotDuration:
          dto.estimateSlotDuration ?? schedule.estimateSlotDuration,
        constructionScheduleMode:
          dto.constructionScheduleMode ?? schedule.constructionScheduleMode,
        constructionAvailableDays:
          dto.constructionAvailableDays ?? schedule.constructionAvailableDays,
        constructionStartTime:
          dto.constructionStartTime ?? schedule.constructionStartTime,
        constructionEndTime:
          dto.constructionEndTime ?? schedule.constructionEndTime,
        constructionSlotDuration:
          dto.constructionSlotDuration ?? schedule.constructionSlotDuration,
        bookingPeriodMonths:
          dto.bookingPeriodMonths ?? schedule.bookingPeriodMonths,
      });
    } else {
      // 새 스케줄 생성
      schedule = this.serviceScheduleRepository.create({
        serviceId,
        estimateScheduleMode: dto.estimateScheduleMode ?? ScheduleMode.GLOBAL,
        estimateAvailableDays: dto.estimateAvailableDays ?? null,
        estimateStartTime: dto.estimateStartTime ?? null,
        estimateEndTime: dto.estimateEndTime ?? null,
        estimateSlotDuration: dto.estimateSlotDuration ?? null,
        constructionScheduleMode:
          dto.constructionScheduleMode ?? ScheduleMode.GLOBAL,
        constructionAvailableDays: dto.constructionAvailableDays ?? null,
        constructionStartTime: dto.constructionStartTime ?? null,
        constructionEndTime: dto.constructionEndTime ?? null,
        constructionSlotDuration: dto.constructionSlotDuration ?? null,
        bookingPeriodMonths: dto.bookingPeriodMonths ?? 3,
      });
    }

    return this.serviceScheduleRepository.save(schedule);
  }

  /**
   * Service 엔티티를 ServiceListItemDto로 변환
   */
  private async toServiceListItemDto(
    service: Service,
  ): Promise<ServiceListItemDto> {
    // 서비스 가능 지역을 시/도 단위로 그룹핑
    const serviceableRegions = await this.groupRegionsBySido(
      service.serviceRegions,
    );

    return {
      id: service.id.toString(),
      title: service.title,
      description: service.description,
      icon: {
        id: service.icon.id,
        name: service.icon.name,
        type: service.icon.type,
        createdAt: service.icon.createdAt,
      },
      iconBgColor: service.iconBgColor,
      iconColor: service.iconColor,
      duration: service.duration,
      requiresTimeSelection: service.requiresTimeSelection,
      serviceableRegions,
    };
  }

  /**
   * 서비스 지역을 시/도 단위로 그룹핑
   * SIGUNGU 레벨만 있는 경우에도 parentId를 기준으로 시/도별 그룹핑 수행
   */
  private async groupRegionsBySido(
    serviceRegions: ServiceRegion[],
  ): Promise<ServiceableRegionDto[]> {
    // 시/도 레벨의 지역
    const sidoRegions = serviceRegions.filter(
      (sr) => sr.district?.level === DistrictLevel.SIDO,
    );

    // 시/군/구 레벨의 지역들
    const sigunguRegions = serviceRegions.filter(
      (sr) => sr.district?.level === DistrictLevel.SIGUNGU,
    );

    const result: ServiceableRegionDto[] = [];

    // Case 1: SIDO 레벨 데이터가 있는 경우 (기존 로직)
    if (sidoRegions.length > 0) {
      for (const sidoRegion of sidoRegions) {
        const sido = sidoRegion.district;

        // 해당 시/도 하위의 시/군/구 지역 찾기
        const cities: CityDto[] = sigunguRegions
          .filter((sr) => sr.district?.parentId === sido.id)
          .map((sr) => ({
            id: sr.district.id.toString(),
            name: sr.district.name,
            estimateFee:
              Number(sr.estimateFee) !== Number(sidoRegion.estimateFee)
                ? Number(sr.estimateFee)
                : null,
          }));

        // 시/군/구가 없으면 해당 시/도의 모든 시/군/구 조회
        if (cities.length === 0) {
          const allSigungus = await this.districtRepository.find({
            where: {
              parentId: sido.id,
              level: DistrictLevel.SIGUNGU,
              isActive: true,
            },
            order: { name: 'ASC' },
          });

          cities.push(
            ...allSigungus.map((sigungu) => ({
              id: sigungu.id.toString(),
              name: sigungu.name,
              estimateFee: null, // 상위 지역 기본값 사용
            })),
          );
        }

        result.push({
          id: sido.id.toString(),
          name: sido.name,
          estimateFee: Number(sidoRegion.estimateFee),
          cities,
        });
      }

      return result;
    }

    // Case 2: SIGUNGU 레벨만 있는 경우 (새로운 로직)
    // parentId(시/도 ID)를 기준으로 그룹핑
    const sidoGroupMap = new Map<number, ServiceRegion[]>();

    for (const sr of sigunguRegions) {
      const parentId = sr.district?.parentId;
      if (parentId) {
        if (!sidoGroupMap.has(parentId)) {
          sidoGroupMap.set(parentId, []);
        }
        sidoGroupMap.get(parentId).push(sr);
      }
    }

    // 각 시/도별로 결과 생성
    for (const [sidoId, regions] of sidoGroupMap) {
      const sido = await this.districtRepository.findOne({
        where: { id: sidoId },
      });

      if (!sido) continue;

      // 시/도의 기본 출장비 계산 (최소값)
      const baseEstimateFee = Math.min(
        ...regions.map((r) => Number(r.estimateFee)),
      );

      const cities: CityDto[] = regions.map((sr) => ({
        id: sr.district.id.toString(),
        name: sr.district.name,
        estimateFee:
          Number(sr.estimateFee) !== baseEstimateFee
            ? Number(sr.estimateFee)
            : null,
      }));

      result.push({
        id: sido.id.toString(),
        name: sido.name,
        estimateFee: baseEstimateFee,
        cities,
      });
    }

    // 시/도 코드 순으로 정렬
    result.sort((a, b) => parseInt(a.id) - parseInt(b.id));

    return result;
  }
}
