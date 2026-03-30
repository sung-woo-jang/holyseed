import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from './entities';
import {
  CreateServiceDto,
  ServiceDetailDto,
  ServiceListItemDto,
  UpdateServiceDto,
  ServiceAdminListItemDto,
  ServiceAdminDetailDto,
} from './dto';
import { Icon } from '@lc/modules/icons/entities/icon.entity';
import { ERROR_MESSAGES } from '@common/constants';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    @InjectRepository(Icon)
    private readonly iconRepository: Repository<Icon>,
  ) {}

  /**
   * 서비스 목록 조회
   */
  async findAll(): Promise<ServiceListItemDto[]> {
    const services = await this.serviceRepository.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC', id: 'ASC' },
    });

    return services.map((service) => this.toServiceListItemDto(service));
  }

  /**
   * ID로 서비스 조회
   */
  async findById(id: number): Promise<Service | null> {
    return this.serviceRepository.findOne({
      where: { id },
    });
  }

  /**
   * [관리자] 서비스 목록 조회
   */
  async findAllForAdmin(): Promise<ServiceAdminListItemDto[]> {
    const services = await this.serviceRepository.find({
      relations: ['icon'],
      order: { sortOrder: 'ASC', id: 'ASC' },
    });

    return services.map((service) => this.toAdminListItemDto(service));
  }

  /**
   * [관리자] 서비스 상세 조회
   */
  async findByIdForAdmin(id: number): Promise<ServiceAdminDetailDto> {
    const service = await this.serviceRepository.findOne({
      where: { id },
      relations: ['icon'],
    });

    if (!service) {
      throw new NotFoundException(ERROR_MESSAGES.SERVICE.NOT_FOUND);
    }

    return this.toAdminDetailDto(service);
  }

  /**
   * 관리자용 서비스 목록 DTO 변환
   */
  private toAdminListItemDto(service: Service): ServiceAdminListItemDto {
    return {
      id: service.id,
      title: service.title,
      description: service.description,
      iconName: service.icon?.name ?? '',
      iconBgColor: service.iconBgColor ?? '',
      iconColor: service.iconColor ?? '',
      duration: service.duration,
      requiresTimeSelection: service.requiresTimeSelection,
      isActive: service.isActive,
      sortOrder: service.sortOrder,
      createdAt: service.createdAt.toISOString(),
      updatedAt: service.updatedAt.toISOString(),
    };
  }

  /**
   * 관리자용 서비스 상세 DTO 변환
   */
  private toAdminDetailDto(service: Service): ServiceAdminDetailDto {
    return {
      id: service.id,
      title: service.title,
      description: service.description,
      icon: {
        id: service.icon.id,
        name: service.icon.name,
        type: service.icon.type,
      },
      iconBgColor: service.iconBgColor ?? '',
      iconColor: service.iconColor ?? '',
      duration: service.duration,
      requiresTimeSelection: service.requiresTimeSelection,
      isActive: service.isActive,
      sortOrder: service.sortOrder,
      createdAt: service.createdAt.toISOString(),
      updatedAt: service.updatedAt.toISOString(),
    };
  }

  /**
   * 서비스 생성
   */
  async create(dto: CreateServiceDto): Promise<Service> {
    // 아이콘 존재 여부 확인
    const icon = await this.iconRepository.findOne({
      where: { id: dto.iconId },
    });

    if (!icon) {
      throw new BadRequestException(ERROR_MESSAGES.SERVICE.INVALID_ICON_ID);
    }

    const service = this.serviceRepository.create({
      title: dto.title,
      description: dto.description,
      iconId: dto.iconId,
      iconBgColor: dto.iconBgColor,
      iconColor: dto.iconColor,
      duration: dto.duration,
      requiresTimeSelection: dto.requiresTimeSelection,
      sortOrder: dto.sortOrder ?? 0,
    });

    return this.serviceRepository.save(service);
  }

  /**
   * 서비스 수정
   */
  async update(id: number, dto: UpdateServiceDto): Promise<Service> {
    const service = await this.serviceRepository.findOne({
      where: { id },
    });

    if (!service) {
      throw new NotFoundException(ERROR_MESSAGES.SERVICE.NOT_FOUND);
    }

    // 아이콘 변경 시 존재 여부 확인
    if (dto.iconId && dto.iconId !== service.iconId) {
      const icon = await this.iconRepository.findOne({
        where: { id: dto.iconId },
      });

      if (!icon) {
        throw new BadRequestException(ERROR_MESSAGES.SERVICE.INVALID_ICON_ID);
      }
    }

    // 필드 업데이트
    if (dto.title !== undefined) service.title = dto.title;
    if (dto.description !== undefined) service.description = dto.description;
    if (dto.iconId !== undefined) service.iconId = dto.iconId;
    if (dto.iconBgColor !== undefined) service.iconBgColor = dto.iconBgColor;
    if (dto.iconColor !== undefined) service.iconColor = dto.iconColor;
    if (dto.duration !== undefined) service.duration = dto.duration;
    if (dto.requiresTimeSelection !== undefined)
      service.requiresTimeSelection = dto.requiresTimeSelection;
    if (dto.sortOrder !== undefined) service.sortOrder = dto.sortOrder;

    return this.serviceRepository.save(service);
  }

  /**
   * 서비스 삭제
   */
  async delete(id: number): Promise<void> {
    const service = await this.serviceRepository.findOne({
      where: { id },
    });

    if (!service) {
      throw new NotFoundException(ERROR_MESSAGES.SERVICE.NOT_FOUND);
    }

    await this.serviceRepository.remove(service);
  }

  /**
   * 서비스 활성화/비활성화 토글
   */
  async toggleActive(id: number): Promise<Service> {
    const service = await this.serviceRepository.findOne({
      where: { id },
    });

    if (!service) {
      throw new NotFoundException(ERROR_MESSAGES.SERVICE.NOT_FOUND);
    }

    service.isActive = !service.isActive;
    return this.serviceRepository.save(service);
  }

  /**
   * 서비스 상세 DTO 변환
   */
  async toServiceDetailDto(service: Service): Promise<ServiceDetailDto> {
    return {
      id: service.id.toString(),
      title: service.title,
      description: service.description,
      icon: {
        id: service.icon.id,
        name: service.icon.name,
        type: service.icon.type,
      },
      iconBgColor: service.iconBgColor ?? '',
      iconColor: service.iconColor ?? '',
      duration: service.duration,
      requiresTimeSelection: service.requiresTimeSelection,
    };
  }

  /**
   * 서비스 목록 아이템 DTO 변환
   */
  private toServiceListItemDto(service: Service): ServiceListItemDto {
    return {
      id: service.id.toString(),
      title: service.title,
      description: service.description,
      icon: {
        id: service.icon.id,
        name: service.icon.name,
        type: service.icon.type,
      },
      iconBgColor: service.iconBgColor ?? '',
      iconColor: service.iconColor ?? '',
      duration: service.duration,
      requiresTimeSelection: service.requiresTimeSelection,
    };
  }
}
