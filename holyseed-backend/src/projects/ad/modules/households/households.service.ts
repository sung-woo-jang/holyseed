import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Household } from './entities/household.entity';
import { Membership, MemberRole } from '../memberships/entities/membership.entity';
import { AdUser } from '../users/entities/ad-user.entity';
import { CreateHouseholdDto } from './dto/request/create-household.dto';
import { UpdateHouseholdDto } from './dto/request/update-household.dto';

@Injectable()
export class HouseholdsService {
  constructor(
    @InjectRepository(Household)
    private readonly householdRepo: Repository<Household>,
    @InjectRepository(Membership)
    private readonly membershipRepo: Repository<Membership>,
    @InjectRepository(AdUser)
    private readonly userRepo: Repository<AdUser>,
  ) {}

  async findAllByUser(userId: number) {
    const memberships = await this.membershipRepo.find({ where: { userId } });
    if (!memberships.length) return [];
    const ids = memberships.map((m) => m.householdId);
    const roleMap = new Map(memberships.map((m) => [m.householdId, m.role]));
    const households = await this.householdRepo.findByIds(ids);
    return households.map((h) => ({ ...h, role: roleMap.get(h.id) ?? MemberRole.VIEWER }));
  }

  async findOne(id: number): Promise<Household> {
    const h = await this.householdRepo.findOne({ where: { id } });
    if (!h) throw new NotFoundException('가구를 찾을 수 없습니다.');
    return h;
  }

  async create(userId: number, dto: CreateHouseholdDto): Promise<Household> {
    const household = this.householdRepo.create({ ...dto, ownerUserId: userId });
    const saved = await this.householdRepo.save(household);

    const membership = this.membershipRepo.create({
      householdId: saved.id,
      userId,
      role: MemberRole.OWNER,
      joinedAt: new Date(),
    });
    await this.membershipRepo.save(membership);

    return saved;
  }

  async update(id: number, dto: UpdateHouseholdDto): Promise<Household> {
    const h = await this.findOne(id);
    Object.assign(h, dto);
    return this.householdRepo.save(h);
  }

  async getMembers(householdId: number) {
    const memberships = await this.membershipRepo.find({ where: { householdId } });
    const users = await Promise.all(
      memberships.map(async (m) => {
        const user = await this.userRepo.findOne({ where: { id: m.userId } });
        return { ...user, role: m.role, joinedAt: m.joinedAt };
      }),
    );
    return users;
  }

  async changeMemberRole(householdId: number, targetUserId: number, role: MemberRole, requesterId: number) {
    const household = await this.findOne(householdId);

    if (role === MemberRole.OWNER) {
      throw new BadRequestException('OWNER 역할은 transfer-owner를 통해 양도하세요.');
    }

    if (targetUserId === requesterId && household.ownerUserId === requesterId) {
      throw new ForbiddenException('OWNER는 자신의 역할을 변경할 수 없습니다.');
    }

    const membership = await this.membershipRepo.findOne({ where: { householdId, userId: targetUserId } });
    if (!membership) throw new NotFoundException('해당 멤버를 찾을 수 없습니다.');

    membership.role = role;
    return this.membershipRepo.save(membership);
  }

  async removeMember(householdId: number, targetUserId: number, _requesterId: number) {
    const household = await this.findOne(householdId);

    if (targetUserId === household.ownerUserId) {
      throw new ForbiddenException('OWNER는 양도 후에만 나갈 수 있습니다.');
    }

    const membership = await this.membershipRepo.findOne({ where: { householdId, userId: targetUserId } });
    if (!membership) throw new NotFoundException('해당 멤버를 찾을 수 없습니다.');

    await this.membershipRepo.remove(membership);
  }

  async transferOwner(householdId: number, newOwnerUserId: number, requesterId: number) {
    const household = await this.findOne(householdId);

    if (household.ownerUserId !== requesterId) {
      throw new ForbiddenException('OWNER만 소유권을 양도할 수 있습니다.');
    }

    const newOwnerMembership = await this.membershipRepo.findOne({
      where: { householdId, userId: newOwnerUserId },
    });
    if (!newOwnerMembership) throw new NotFoundException('해당 멤버를 찾을 수 없습니다.');

    const oldOwnerMembership = await this.membershipRepo.findOne({
      where: { householdId, userId: requesterId },
    });

    newOwnerMembership.role = MemberRole.OWNER;
    if (oldOwnerMembership) oldOwnerMembership.role = MemberRole.EDITOR;
    household.ownerUserId = newOwnerUserId;

    await this.membershipRepo.save(newOwnerMembership);
    if (oldOwnerMembership) await this.membershipRepo.save(oldOwnerMembership);
    return this.householdRepo.save(household);
  }
}
