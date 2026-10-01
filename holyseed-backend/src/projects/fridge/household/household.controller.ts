import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { FridgeUserId, HouseholdId, HouseholdRole } from '../common/decorators';
import { HouseholdGuard } from '../common/household.guard';
import { ok } from '../common/ok';
import { CreateHouseholdDto, JoinHouseholdDto, UpdateHouseholdDto } from './household.dto';
import { HouseholdService } from './household.service';

@ApiTags('Fridge 가구')
@ApiBearerAuth()
@Controller('fridge')
export class HouseholdController {
  constructor(private readonly service: HouseholdService) {}

  // ── 가구가 없어도 쓰는 엔드포인트 (HouseholdGuard 없음) ──

  @Get('me')
  @ApiOperation({ summary: '내 정보 + 소속 가구(없으면 null)' })
  async me(@FridgeUserId() userId: number) {
    return ok('조회 성공', await this.service.me(userId));
  }

  @Post('household/create')
  @ApiOperation({ summary: '새 가구 만들기 (만든 사람이 방장)' })
  async create(@FridgeUserId() userId: number, @Body() dto: CreateHouseholdDto) {
    return ok('가구를 만들었어요.', await this.service.create(userId, dto));
  }

  @Post('household/join')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: '초대 코드로 가구 참여 (1회용)' })
  async join(@FridgeUserId() userId: number, @Body() dto: JoinHouseholdDto) {
    return ok('가구에 참여했어요.', await this.service.join(userId, dto.code));
  }

  // ── 가구 소속이 필요한 엔드포인트 ──

  @Get('household/members')
  @UseGuards(HouseholdGuard)
  @ApiOperation({ summary: '가구 구성원(로그인 계정) 목록' })
  async members(@HouseholdId() householdId: number) {
    return ok('조회 성공', await this.service.members(householdId));
  }

  @Post('household/update')
  @UseGuards(HouseholdGuard)
  @ApiOperation({ summary: '가구 이름·야간모드·기본 유통기한 수정' })
  async update(@HouseholdId() householdId: number, @Body() dto: UpdateHouseholdDto) {
    return ok('저장했어요.', await this.service.update(householdId, dto));
  }

  @Post('household/invite')
  @UseGuards(HouseholdGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: '초대 코드 발급 (방장만, 7일·1회용)' })
  async invite(
    @HouseholdId() householdId: number,
    @HouseholdRole() role: string,
    @FridgeUserId() userId: number,
  ) {
    this.service.assertOwner(role);
    return ok('초대 코드를 만들었어요.', await this.service.invite(householdId, userId));
  }

  @Post('household/leave')
  @UseGuards(HouseholdGuard)
  @ApiOperation({ summary: '가구에서 나가기' })
  async leave(@HouseholdId() householdId: number, @FridgeUserId() userId: number) {
    await this.service.leave(householdId, userId);
    return ok('가구에서 나갔어요.');
  }

  @Post('household/members/:userId/remove')
  @UseGuards(HouseholdGuard)
  @ApiOperation({ summary: '구성원 내보내기 (방장만)' })
  async removeMember(
    @HouseholdId() householdId: number,
    @HouseholdRole() role: string,
    @FridgeUserId() actorId: number,
    @Param('userId', ParseIntPipe) targetId: number,
  ) {
    this.service.assertOwner(role);
    await this.service.removeMember(householdId, targetId, actorId);
    return ok('내보냈어요.');
  }
}
