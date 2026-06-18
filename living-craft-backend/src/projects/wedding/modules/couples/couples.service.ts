import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Couple } from './entities/couple.entity';
import { UpdateCoupleDto } from './dto/request/update-couple.dto';
import { WeddingUserRole } from '../auth/entities/wedding-user.entity';

@Injectable()
export class CouplesService {
  constructor(
    @InjectRepository(Couple)
    private readonly coupleRepo: Repository<Couple>,
  ) {}

  async findAll(user: { coupleId: string; role: string }): Promise<Couple[]> {
    if (user.role === WeddingUserRole.SUPER_ADMIN) {
      return this.coupleRepo.find({ order: { createdAt: 'DESC' } });
    }
    return this.coupleRepo.find({ where: { id: user.coupleId }, order: { createdAt: 'DESC' } });
  }

  async findById(id: string, user: { coupleId: string; role: string }): Promise<Couple> {
    this._checkAccess(id, user);

    const couple = await this.coupleRepo.findOne({ where: { id } });
    if (!couple) {
      throw new NotFoundException('커플 정보를 찾을 수 없습니다.');
    }
    return couple;
  }

  async findBySlug(slug: string): Promise<Couple> {
    const couple = await this.coupleRepo.findOne({ where: { slug } });
    if (!couple) {
      throw new NotFoundException('청첩장을 찾을 수 없습니다.');
    }
    return couple;
  }

  async update(id: string, dto: UpdateCoupleDto, user: { coupleId: string; role: string }): Promise<Couple> {
    this._checkAccess(id, user);

    const couple = await this.coupleRepo.findOne({ where: { id } });
    if (!couple) {
      throw new NotFoundException('커플 정보를 찾을 수 없습니다.');
    }

    Object.assign(couple, {
      ...(dto.groomName !== undefined && { groomName: dto.groomName }),
      ...(dto.brideName !== undefined && { brideName: dto.brideName }),
      ...(dto.weddingDate !== undefined && { weddingDate: new Date(dto.weddingDate) }),
      ...(dto.weddingVenue !== undefined && { weddingVenue: dto.weddingVenue }),
      ...(dto.accountInfo !== undefined && { accountInfo: dto.accountInfo }),
      ...(dto.themeSettings !== undefined && { themeSettings: dto.themeSettings }),
    });

    return this.coupleRepo.save(couple);
  }

  async delete(id: string, user: { coupleId: string; role: string }): Promise<void> {
    if (user.role !== WeddingUserRole.SUPER_ADMIN) {
      throw new ForbiddenException('SUPER_ADMIN 권한이 필요합니다.');
    }

    const couple = await this.coupleRepo.findOne({ where: { id } });
    if (!couple) {
      throw new NotFoundException('커플 정보를 찾을 수 없습니다.');
    }

    await this.coupleRepo.remove(couple);
  }

  private _checkAccess(coupleId: string, user: { coupleId: string; role: string }): void {
    if (user.role === WeddingUserRole.SUPER_ADMIN) return;
    if (user.coupleId !== coupleId) {
      throw new ForbiddenException('접근 권한이 없습니다.');
    }
  }
}
