import { Body, Controller, Get, Param, ParseIntPipe, Post, Request, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '@common/decorators';
import { InvitationsService } from './invitations.service';
import { MembershipGuard } from '../../common/guards/membership.guard';
import { RequireMembership } from '../../common/decorators/require-membership.decorator';
import { MemberRole } from '../memberships/entities/membership.entity';
import { CreateInvitationDto } from './dto/request/create-invitation.dto';

@ApiTags('AD 초대')
@Controller('ad')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Post('households/:householdId/invitations')
  @UseGuards(MembershipGuard)
  @RequireMembership({ minRole: MemberRole.OWNER })
  @ApiOperation({ summary: '초대 코드 발급' })
  async create(
    @Param('householdId', ParseIntPipe) householdId: number,
    @Request() req: any,
    @Body() dto: CreateInvitationDto,
  ) {
    const data = await this.invitationsService.create(householdId, req.user.userId, dto);
    return { success: true, message: '초대 코드 발급 성공', data, timestamp: new Date().toISOString() };
  }

  @Get('households/:householdId/invitations')
  @UseGuards(MembershipGuard)
  @RequireMembership({ minRole: MemberRole.OWNER })
  @ApiOperation({ summary: '가구 초대 목록 조회' })
  async findByHousehold(@Param('householdId', ParseIntPipe) householdId: number) {
    const data = await this.invitationsService.findByHousehold(householdId);
    return { success: true, message: '조회 성공', data, timestamp: new Date().toISOString() };
  }

  @Post('invitations/:code/preview')
  @Public()
  @ApiOperation({ summary: '초대 코드 미리보기 (비인증)' })
  async preview(@Param('code') code: string) {
    const data = await this.invitationsService.preview(code);
    return { success: true, message: '조회 성공', data, timestamp: new Date().toISOString() };
  }

  @Post('invitations/:code/accept')
  @ApiOperation({ summary: '초대 수락' })
  async accept(@Param('code') code: string, @Request() req: any) {
    const data = await this.invitationsService.accept(code, req.user.userId);
    return { success: true, message: '초대 수락 성공', data, timestamp: new Date().toISOString() };
  }

  @Post('invitations/:invitationId/revoke')
  @ApiOperation({ summary: '초대 취소' })
  async revoke(@Param('invitationId', ParseIntPipe) invitationId: number) {
    await this.invitationsService.revoke(invitationId);
    return { success: true, message: '초대 취소 성공', data: null, timestamp: new Date().toISOString() };
  }
}
