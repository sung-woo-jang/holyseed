import { randomInt } from 'crypto';
import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  FridgeFreqItem,
  FridgeHousehold,
  FridgeHouseholdMember,
  FridgeInvitation,
  FridgePerson,
  FridgeUser,
} from '../entities';
import { DEFAULT_FREQ, PERSON_PALETTE } from '../common/seed';
import { CreateHouseholdDto, UpdateHouseholdDto } from './household.dto';

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
// 헷갈리는 문자(0/O, 1/I) 제외
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const householdView = (h: FridgeHousehold) => ({
  id: h.id,
  name: h.name,
  nightMode: h.nightMode,
  defaultDays: h.defaultDays,
});

@Injectable()
export class HouseholdService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(FridgeUser) private readonly userRepo: Repository<FridgeUser>,
    @InjectRepository(FridgeHousehold) private readonly householdRepo: Repository<FridgeHousehold>,
    @InjectRepository(FridgeHouseholdMember) private readonly memberRepo: Repository<FridgeHouseholdMember>,
    @InjectRepository(FridgeInvitation) private readonly inviteRepo: Repository<FridgeInvitation>,
  ) {}

  async me(userId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');
    const member = await this.memberRepo.findOne({ where: { userId }, relations: { household: true } });
    return {
      user: { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl },
      household: member ? { ...householdView(member.household), role: member.role } : null,
    };
  }

  async create(userId: number, dto: CreateHouseholdDto) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');

    return this.dataSource.transaction(async (em) => {
      if (await em.exists(FridgeHouseholdMember, { where: { userId } })) {
        throw new ConflictException('이미 가구에 참여 중입니다.');
      }
      const household = await em.save(em.create(FridgeHousehold, { name: dto.name }));
      await em.save(em.create(FridgeHouseholdMember, { householdId: household.id, userId, role: 'OWNER' }));
      await em.save(em.create(FridgePerson, { householdId: household.id, name: user.name.slice(0, 30), color: PERSON_PALETTE[0] }));
      await em.save(DEFAULT_FREQ.map((f) => em.create(FridgeFreqItem, { householdId: household.id, ...f })));
      return { ...householdView(household), role: 'OWNER' as const };
    });
  }

  async join(userId: number, code: string) {
    return this.dataSource.transaction(async (em) => {
      if (await em.exists(FridgeHouseholdMember, { where: { userId } })) {
        throw new ConflictException('이미 가구에 참여 중입니다.');
      }
      // 행 잠금으로 동시에 같은 코드를 쓰는 경우도 1회만 성공
      const invite = await em.findOne(FridgeInvitation, { where: { code }, lock: { mode: 'pessimistic_write' } });
      if (!invite || invite.usedAt || invite.expiresAt.getTime() < Date.now()) {
        throw new BadRequestException('유효하지 않거나 만료된 초대 코드입니다.');
      }
      invite.usedAt = new Date();
      await em.save(invite);
      await em.save(em.create(FridgeHouseholdMember, { householdId: invite.householdId, userId, role: 'MEMBER' }));
      const household = await em.findOneOrFail(FridgeHousehold, { where: { id: invite.householdId } });
      return { ...householdView(household), role: 'MEMBER' as const };
    });
  }

  async invite(householdId: number, userId: number) {
    const expiresAt = new Date(Date.now() + INVITE_TTL_MS);
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = Array.from({ length: 8 }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join('');
      if (await this.inviteRepo.exists({ where: { code } })) continue;
      await this.inviteRepo.save(this.inviteRepo.create({ householdId, code, expiresAt, createdByUserId: userId }));
      return { code, expiresAt };
    }
    throw new ConflictException('초대 코드를 만들지 못했어요. 다시 시도해 주세요.');
  }

  async members(householdId: number) {
    const rows = await this.memberRepo.find({
      where: { householdId },
      relations: { user: true },
      order: { id: 'ASC' },
    });
    return rows.map((m) => ({
      userId: m.userId,
      name: m.user.name,
      email: m.user.email,
      avatarUrl: m.user.avatarUrl,
      role: m.role,
    }));
  }

  async leave(householdId: number, userId: number) {
    await this.dataSource.transaction(async (em) => {
      const me = await em.findOne(FridgeHouseholdMember, { where: { householdId, userId } });
      if (!me) throw new NotFoundException('참여 중인 가구가 없습니다.');
      await em.delete(FridgeHouseholdMember, { id: me.id });

      const rest = await em.find(FridgeHouseholdMember, { where: { householdId }, order: { id: 'ASC' } });
      if (rest.length === 0) {
        // 마지막 구성원이 나가면 가구와 모든 데이터를 정리 (FK cascade)
        await em.delete(FridgeHousehold, { id: householdId });
        return;
      }
      if (me.role === 'OWNER' && !rest.some((m) => m.role === 'OWNER')) {
        await em.update(FridgeHouseholdMember, { id: rest[0].id }, { role: 'OWNER' });
      }
    });
  }

  async removeMember(householdId: number, targetUserId: number, actorUserId: number) {
    if (targetUserId === actorUserId) throw new BadRequestException('본인은 내보낼 수 없어요. 나가기를 이용해 주세요.');
    const target = await this.memberRepo.findOne({ where: { householdId, userId: targetUserId } });
    if (!target) throw new NotFoundException('구성원을 찾을 수 없습니다.');
    await this.memberRepo.delete({ id: target.id });
  }

  async update(householdId: number, dto: UpdateHouseholdDto) {
    const household = await this.householdRepo.findOne({ where: { id: householdId } });
    if (!household) throw new NotFoundException('가구를 찾을 수 없습니다.');
    Object.assign(household, dto);
    return householdView(await this.householdRepo.save(household));
  }

  assertOwner(role: string) {
    if (role !== 'OWNER') throw new ForbiddenException('방장만 할 수 있어요.');
  }
}
