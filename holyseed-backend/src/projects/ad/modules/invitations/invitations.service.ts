import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invitation } from './entities/invitation.entity';
import { Membership, MemberRole } from '../memberships/entities/membership.entity';
import { Household } from '../households/entities/household.entity';
import { CreateInvitationDto } from './dto/request/create-invitation.dto';

@Injectable()
export class InvitationsService {
  constructor(
    @InjectRepository(Invitation)
    private readonly invitationRepo: Repository<Invitation>,
    @InjectRepository(Membership)
    private readonly membershipRepo: Repository<Membership>,
    @InjectRepository(Household)
    private readonly householdRepo: Repository<Household>,
  ) {}

  async create(householdId: number, userId: number, dto: CreateInvitationDto): Promise<Invitation> {
    const code = this.generateCode();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invitation = this.invitationRepo.create({
      householdId,
      role: dto.role ?? MemberRole.EDITOR,
      code,
      expiresAt,
      createdByUserId: userId,
    });
    return this.invitationRepo.save(invitation);
  }

  async findByHousehold(householdId: number): Promise<Invitation[]> {
    return this.invitationRepo.find({
      where: { householdId },
      order: { createdAt: 'DESC' },
    });
  }

  async preview(code: string) {
    const invitation = await this.invitationRepo.findOne({ where: { code } });
    if (!invitation) throw new NotFoundException('초대 코드를 찾을 수 없습니다.');
    if (invitation.expiresAt < new Date()) throw new BadRequestException('만료된 초대 코드입니다.');
    if (invitation.acceptedAt) throw new BadRequestException('이미 사용된 초대 코드입니다.');

    const household = await this.householdRepo.findOne({ where: { id: invitation.householdId } });
    return { invitation, household };
  }

  async accept(code: string, userId: number): Promise<Membership> {
    const { invitation } = await this.preview(code);

    const existing = await this.membershipRepo.findOne({
      where: { householdId: invitation.householdId, userId },
    });
    if (existing) throw new ConflictException('이미 해당 가구의 멤버입니다.');

    const membership = this.membershipRepo.create({
      householdId: invitation.householdId,
      userId,
      role: invitation.role,
      invitedAt: invitation.createdAt,
      joinedAt: new Date(),
      invitedByUserId: invitation.createdByUserId,
    });
    await this.membershipRepo.save(membership);

    invitation.acceptedByUserId = userId;
    invitation.acceptedAt = new Date();
    await this.invitationRepo.save(invitation);

    return membership;
  }

  async revoke(invitationId: number): Promise<void> {
    const invitation = await this.invitationRepo.findOne({ where: { id: invitationId } });
    if (!invitation) throw new NotFoundException('초대를 찾을 수 없습니다.');
    await this.invitationRepo.remove(invitation);
  }

  private generateCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }
}
