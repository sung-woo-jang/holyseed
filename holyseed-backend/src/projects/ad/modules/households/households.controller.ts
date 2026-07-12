import { Body, Controller, Get, Param, ParseIntPipe, Post, Request, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { HouseholdsService } from './households.service';
import { MembershipGuard } from '../../common/guards/membership.guard';
import { RequireMembership } from '../../common/decorators/require-membership.decorator';
import { MemberRole } from '../memberships/entities/membership.entity';
import { CreateHouseholdDto } from './dto/request/create-household.dto';
import { UpdateHouseholdDto } from './dto/request/update-household.dto';
import { ChangeRoleDto } from './dto/request/change-role.dto';
import { TransferOwnerDto } from './dto/request/transfer-owner.dto';

@ApiTags('AD 가구')
@Controller('ad/households')
export class HouseholdsController {
  constructor(private readonly householdsService: HouseholdsService) {}

  @Get()
  @ApiOperation({ summary: '내 가구 목록 조회' })
  async findAll(@Request() req: any) {
    const data = await this.householdsService.findAllByUser(req.user.userId);
    return { success: true, message: '조회 성공', data, timestamp: new Date().toISOString() };
  }

  @Post()
  @ApiOperation({ summary: '가구 생성' })
  async create(@Request() req: any, @Body() dto: CreateHouseholdDto) {
    const data = await this.householdsService.create(req.user.userId, dto);
    return { success: true, message: '가구 생성 성공', data, timestamp: new Date().toISOString() };
  }

  @Get(':householdId')
  @UseGuards(MembershipGuard)
  @ApiOperation({ summary: '가구 상세 조회' })
  async findOne(@Param('householdId', ParseIntPipe) householdId: number) {
    const data = await this.householdsService.findOne(householdId);
    return { success: true, message: '조회 성공', data, timestamp: new Date().toISOString() };
  }

  @Post(':householdId/update')
  @UseGuards(MembershipGuard)
  @RequireMembership({ minRole: MemberRole.EDITOR })
  @ApiOperation({ summary: '가구 정보 수정' })
  async update(@Param('householdId', ParseIntPipe) householdId: number, @Body() dto: UpdateHouseholdDto) {
    const data = await this.householdsService.update(householdId, dto);
    return { success: true, message: '수정 성공', data, timestamp: new Date().toISOString() };
  }

  @Get(':householdId/members')
  @UseGuards(MembershipGuard)
  @ApiOperation({ summary: '가구 멤버 목록 조회' })
  async getMembers(@Param('householdId', ParseIntPipe) householdId: number) {
    const data = await this.householdsService.getMembers(householdId);
    return { success: true, message: '조회 성공', data, timestamp: new Date().toISOString() };
  }

  @Post(':householdId/members/:userId/role')
  @UseGuards(MembershipGuard)
  @RequireMembership({ minRole: MemberRole.OWNER })
  @ApiOperation({ summary: '멤버 역할 변경' })
  async changeRole(
    @Param('householdId', ParseIntPipe) householdId: number,
    @Param('userId', ParseIntPipe) targetUserId: number,
    @Request() req: any,
    @Body() dto: ChangeRoleDto,
  ) {
    const data = await this.householdsService.changeMemberRole(householdId, targetUserId, dto.role, req.user.userId);
    return { success: true, message: '역할 변경 성공', data, timestamp: new Date().toISOString() };
  }

  @Post(':householdId/members/:userId/remove')
  @UseGuards(MembershipGuard)
  @RequireMembership({ minRole: MemberRole.OWNER })
  @ApiOperation({ summary: '멤버 제거' })
  async removeMember(
    @Param('householdId', ParseIntPipe) householdId: number,
    @Param('userId', ParseIntPipe) targetUserId: number,
    @Request() req: any,
  ) {
    await this.householdsService.removeMember(householdId, targetUserId, req.user.userId);
    return { success: true, message: '멤버 제거 성공', data: null, timestamp: new Date().toISOString() };
  }

  @Post(':householdId/members/transfer-owner')
  @UseGuards(MembershipGuard)
  @RequireMembership({ minRole: MemberRole.OWNER })
  @ApiOperation({ summary: 'OWNER 양도' })
  async transferOwner(
    @Param('householdId', ParseIntPipe) householdId: number,
    @Request() req: any,
    @Body() dto: TransferOwnerDto,
  ) {
    const data = await this.householdsService.transferOwner(householdId, dto.newOwnerUserId, req.user.userId);
    return { success: true, message: 'OWNER 양도 성공', data, timestamp: new Date().toISOString() };
  }
}
