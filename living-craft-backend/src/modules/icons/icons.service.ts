import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Icon } from './entities/icon.entity';
import { IconType } from './enums/icon-type.enum';
import { IconListDto, IconListPaginatedDto } from './dto/response';
import { CreateIconDto, UpdateIconDto } from './dto';

@Injectable()
export class IconsService {
  constructor(
    @InjectRepository(Icon)
    private readonly iconRepository: Repository<Icon>,
  ) {}

  /**
   * 아이콘 목록 조회 (페이지네이션 지원)
   * @param type 아이콘 타입 필터 (선택)
   * @param search 아이콘 이름 검색 (선택)
   * @param limit 최대 결과 개수 (기본: 100, 최대: 500)
   * @param offset 건너뛸 개수 (기본: 0)
   */
  async findAll(
    type?: IconType,
    search?: string,
    limit?: number,
    offset?: number,
  ): Promise<IconListPaginatedDto> {
    const where: any = {};

    if (type) {
      where.type = type;
    }

    if (search) {
      where.name = Like(`%${search}%`);
    }

    // limit 검증 (기본: 100, 최대: 500)
    const take = Math.min(limit || 100, 500);
    const skip = offset || 0;

    // 전체 개수와 데이터를 동시에 조회
    const [icons, total] = await this.iconRepository.findAndCount({
      where,
      order: { name: 'ASC' },
      take,
      skip,
    });

    const items = icons.map((icon) => ({
      id: icon.id,
      name: icon.name,
      type: icon.type,
      createdAt: icon.createdAt,
    }));

    return {
      items,
      total,
      count: items.length,
      limit: take,
      offset: skip,
    };
  }

  /**
   * ID로 아이콘 조회
   * @param id 아이콘 ID
   */
  async findById(id: number): Promise<Icon | null> {
    return this.iconRepository.findOne({ where: { id } });
  }

  /**
   * 아이콘 생성
   * @param dto 아이콘 생성 DTO
   * @throws BadRequestException 중복된 아이콘 이름
   */
  async createIcon(dto: CreateIconDto): Promise<Icon> {
    // 중복 검사
    const exists = await this.iconRepository.findOne({
      where: { name: dto.name },
    });

    if (exists) {
      throw new BadRequestException('이미 존재하는 아이콘 이름입니다.');
    }

    const icon = this.iconRepository.create(dto);
    return await this.iconRepository.save(icon);
  }

  /**
   * 아이콘 수정
   * @param id 아이콘 ID
   * @param dto 아이콘 수정 DTO
   * @throws NotFoundException 아이콘을 찾을 수 없음
   * @throws BadRequestException 중복된 아이콘 이름
   */
  async updateIcon(id: number, dto: UpdateIconDto): Promise<Icon> {
    const icon = await this.iconRepository.findOne({ where: { id } });

    if (!icon) {
      throw new NotFoundException('아이콘을 찾을 수 없습니다.');
    }

    // 이름 중복 검사 (자기 자신 제외)
    if (dto.name && dto.name !== icon.name) {
      const exists = await this.iconRepository.findOne({
        where: { name: dto.name },
      });

      if (exists) {
        throw new BadRequestException('이미 존재하는 아이콘 이름입니다.');
      }
    }

    Object.assign(icon, dto);
    return await this.iconRepository.save(icon);
  }
}
