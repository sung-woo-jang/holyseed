import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Service,
  ServiceRegion,
  ServiceSchedule,
} from '@modules/services/entities';
import { District } from '@modules/admin/districts/entities';
import { Icon } from '@modules/icons/entities';
import {
  AdminCreateServiceDto,
  AdminUpdateServiceDto,
  UpdateServiceOrderDto,
} from './dto/request';
import { ERROR_MESSAGES } from '@common/constants';

@Injectable()
export class AdminServicesService {
  constructor(
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    @InjectRepository(ServiceRegion)
    private readonly serviceRegionRepository: Repository<ServiceRegion>,
    @InjectRepository(ServiceSchedule)
    private readonly scheduleRepository: Repository<ServiceSchedule>,
    @InjectRepository(District)
    private readonly districtRepository: Repository<District>,
    @InjectRepository(Icon)
    private readonly iconRepository: Repository<Icon>,
  ) {}

  /**
   * 서비스 목록 조회 (관리자)
   */
  async findAll(): Promise<Service[]> {
    return this.serviceRepository.find({
      where: { isActive: true },
      relations: [
        'serviceRegions',
        'serviceRegions.district',
        'serviceRegions.district.parent',
        'schedule',
        'icon',
      ],
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
    });
  }

  /**
   * 서비스 상세 조회
   */
  async findById(id: number): Promise<Service> {
    const service = await this.serviceRepository.findOne({
      where: { id },
      relations: [
        'serviceRegions',
        'serviceRegions.district',
        'serviceRegions.district.parent',
        'schedule',
        'icon',
      ],
    });

    if (!service) {
      throw new NotFoundException(ERROR_MESSAGES.SERVICE.NOT_FOUND);
    }

    return service;
  }

  /**
   * 서비스 생성
   */
  async create(dto: AdminCreateServiceDto): Promise<Service> {
    // iconName으로 Icon 조회
    const icon = await this.iconRepository.findOne({
      where: { name: dto.iconName },
    });

    if (!icon) {
      throw new BadRequestException(
        ERROR_MESSAGES.SERVICE.ICON_NOT_FOUND(dto.iconName),
      );
    }

    // sortOrder가 제공되지 않은 경우 자동 계산
    let sortOrder = dto.sortOrder;
    if (sortOrder === undefined || sortOrder === null) {
      const maxSortOrder = await this.serviceRepository
        .createQueryBuilder('service')
        .select('MAX(service.sortOrder)', 'max')
        .getRawOne();

      sortOrder = (maxSortOrder?.max ?? 0) + 1;
    }

    const service = this.serviceRepository.create({
      title: dto.title,
      description: dto.description,
      iconId: icon.id,
      iconBgColor: dto.iconBgColor,
      iconColor: dto.iconColor,
      duration: dto.duration,
      requiresTimeSelection: dto.requiresTimeSelection,
      sortOrder,
    });

    const savedService = await this.serviceRepository.save(service);

    // 서비스 가능 지역 설정
    if (dto.regions && dto.regions.length > 0) {
      await this.updateServiceRegionsWithFee(savedService.id, dto.regions);
    }

    // 스케줄 저장
    if (dto.schedule) {
      const schedule = this.scheduleRepository.create({
        serviceId: savedService.id,
        estimateScheduleMode: dto.schedule.estimateScheduleMode,
        estimateAvailableDays: dto.schedule.estimateAvailableDays?.length
          ? dto.schedule.estimateAvailableDays
          : null,
        estimateStartTime: dto.schedule.estimateStartTime || null,
        estimateEndTime: dto.schedule.estimateEndTime || null,
        estimateSlotDuration: dto.schedule.estimateSlotDuration || null,
        constructionScheduleMode: dto.schedule.constructionScheduleMode,
        constructionAvailableDays: dto.schedule.constructionAvailableDays
          ?.length
          ? dto.schedule.constructionAvailableDays
          : null,
        constructionStartTime: dto.schedule.constructionStartTime || null,
        constructionEndTime: dto.schedule.constructionEndTime || null,
        constructionSlotDuration: dto.schedule.constructionSlotDuration || null,
        bookingPeriodMonths: dto.schedule.bookingPeriodMonths ?? 3,
      });
      await this.scheduleRepository.save(schedule);
    }

    return this.findById(savedService.id);
  }

  /**
   * 서비스 수정
   */
  async update(id: number, dto: AdminUpdateServiceDto): Promise<Service> {
    const service = await this.findById(id);

    if (dto.title !== undefined) service.title = dto.title;
    if (dto.description !== undefined) service.description = dto.description;

    if (dto.iconName !== undefined) {
      // iconName으로 Icon 조회
      const icon = await this.iconRepository.findOne({
        where: { name: dto.iconName },
      });

      if (!icon) {
        throw new BadRequestException(
          ERROR_MESSAGES.SERVICE.ICON_NOT_FOUND(dto.iconName),
        );
      }

      service.iconId = icon.id;
    }

    if (dto.iconBgColor !== undefined) service.iconBgColor = dto.iconBgColor;
    if (dto.iconColor !== undefined) service.iconColor = dto.iconColor;
    if (dto.duration !== undefined) service.duration = dto.duration;
    if (dto.requiresTimeSelection !== undefined)
      service.requiresTimeSelection = dto.requiresTimeSelection;

    await this.serviceRepository.save(service);

    // 서비스 가능 지역 업데이트
    if (dto.regions !== undefined) {
      await this.updateServiceRegionsWithFee(id, dto.regions);
    }

    // 스케줄 업데이트
    if (dto.schedule !== undefined) {
      let schedule = await this.scheduleRepository.findOne({
        where: { serviceId: id },
      });

      if (schedule) {
        // 기존 스케줄 업데이트
        schedule.estimateScheduleMode = dto.schedule.estimateScheduleMode;
        schedule.estimateAvailableDays = dto.schedule.estimateAvailableDays
          ?.length
          ? dto.schedule.estimateAvailableDays
          : null;
        schedule.estimateStartTime = dto.schedule.estimateStartTime || null;
        schedule.estimateEndTime = dto.schedule.estimateEndTime || null;
        schedule.estimateSlotDuration =
          dto.schedule.estimateSlotDuration || null;
        schedule.constructionScheduleMode =
          dto.schedule.constructionScheduleMode;
        schedule.constructionAvailableDays = dto.schedule
          .constructionAvailableDays?.length
          ? dto.schedule.constructionAvailableDays
          : null;
        schedule.constructionStartTime =
          dto.schedule.constructionStartTime || null;
        schedule.constructionEndTime = dto.schedule.constructionEndTime || null;
        schedule.constructionSlotDuration =
          dto.schedule.constructionSlotDuration || null;
        schedule.bookingPeriodMonths = dto.schedule.bookingPeriodMonths ?? 3;
        await this.scheduleRepository.save(schedule);
      } else {
        // 새 스케줄 생성
        schedule = this.scheduleRepository.create({
          serviceId: id,
          estimateScheduleMode: dto.schedule.estimateScheduleMode,
          estimateAvailableDays: dto.schedule.estimateAvailableDays?.length
            ? dto.schedule.estimateAvailableDays
            : null,
          estimateStartTime: dto.schedule.estimateStartTime || null,
          estimateEndTime: dto.schedule.estimateEndTime || null,
          estimateSlotDuration: dto.schedule.estimateSlotDuration || null,
          constructionScheduleMode: dto.schedule.constructionScheduleMode,
          constructionAvailableDays: dto.schedule.constructionAvailableDays
            ?.length
            ? dto.schedule.constructionAvailableDays
            : null,
          constructionStartTime: dto.schedule.constructionStartTime || null,
          constructionEndTime: dto.schedule.constructionEndTime || null,
          constructionSlotDuration:
            dto.schedule.constructionSlotDuration || null,
          bookingPeriodMonths: dto.schedule.bookingPeriodMonths ?? 3,
        });
        await this.scheduleRepository.save(schedule);
      }
    }

    return this.findById(id);
  }

  /**
   * 서비스 삭제 (soft delete)
   */
  async delete(id: number): Promise<void> {
    const service = await this.findById(id);
    service.isActive = false;
    await this.serviceRepository.save(service);
  }

  /**
   * 서비스 순서 변경
   */
  async updateServiceOrder(dto: UpdateServiceOrderDto): Promise<void> {
    // 트랜잭션으로 일괄 업데이트
    await this.serviceRepository.manager.transaction(async (manager) => {
      for (const item of dto.serviceOrders) {
        await manager.update(
          Service,
          { id: item.id },
          { sortOrder: item.sortOrder },
        );
      }
    });
  }

  /**
   * 서비스 가능 지역 업데이트 (출장비 포함)
   */
  private async updateServiceRegionsWithFee(
    serviceId: number,
    regions: { districtId: number; estimateFee: number }[],
  ): Promise<void> {
    // 기존 지역 삭제
    await this.serviceRegionRepository.delete({ serviceId });

    // 새 지역 추가
    for (const region of regions) {
      const district = await this.districtRepository.findOne({
        where: { id: region.districtId },
      });

      if (district) {
        const serviceRegion = this.serviceRegionRepository.create({
          serviceId,
          districtId: region.districtId,
          estimateFee: region.estimateFee,
        });
        await this.serviceRegionRepository.save(serviceRegion);
      }
    }
  }

  /**
   * 서비스 가능 지역 업데이트 (기존 방식 - 호환성 유지)
   */
  private async updateServiceRegions(
    serviceId: number,
    regions: { regionId: number; cityIds: number[] }[],
  ): Promise<void> {
    // 기존 지역 삭제
    await this.serviceRegionRepository.delete({ serviceId });

    // 새 지역 추가
    for (const region of regions) {
      // 지역의 모든 도시에 대해 ServiceRegion 생성
      for (const cityId of region.cityIds) {
        const district = await this.districtRepository.findOne({
          where: { id: cityId },
        });

        if (district) {
          const serviceRegion = this.serviceRegionRepository.create({
            serviceId,
            districtId: cityId,
            estimateFee: 0, // 기본값 0, 관리자가 나중에 수정 가능
          });
          await this.serviceRegionRepository.save(serviceRegion);
        }
      }
    }
  }
}
