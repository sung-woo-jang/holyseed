import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { WorkLogsService } from './work-logs.service';
import { MembershipGuard } from '../../common/guards/membership.guard';
import { RequireMembership } from '../../common/decorators/require-membership.decorator';
import { MemberRole } from '../memberships/entities/membership.entity';
import { CreateWorkLogDto } from './dto/request/create-work-log.dto';
import { SettleWorkLogDto } from './dto/request/settle-work-log.dto';

@ApiTags('AD 근무표')
@Controller('ad')
export class WorkLogsController {
  constructor(private readonly workLogsService: WorkLogsService) {}

  @Get('households/:householdId/work-logs')
  @UseGuards(MembershipGuard)
  @ApiOperation({ summary: '근무 기록 월별 조회' })
  async findAll(
    @Param('householdId', ParseIntPipe) householdId: number,
    @Query('month') month?: string,
  ) {
    const data = await this.workLogsService.findByHouseholdMonth(householdId, month);
    return { success: true, message: '조회 성공', data, timestamp: new Date().toISOString() };
  }

  @Post('households/:householdId/work-logs')
  @UseGuards(MembershipGuard)
  @RequireMembership({ minRole: MemberRole.EDITOR })
  @ApiOperation({ summary: '근무 기록 생성' })
  async create(
    @Param('householdId', ParseIntPipe) householdId: number,
    @Body() dto: CreateWorkLogDto,
    @Request() req: any,
  ) {
    const data = await this.workLogsService.create(householdId, dto, req.user?.userId);
    return { success: true, message: '근무 기록 생성 성공', data, timestamp: new Date().toISOString() };
  }

  @Post('work-logs/:id/update')
  @ApiOperation({ summary: '근무 기록 수정' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: Partial<CreateWorkLogDto>) {
    const data = await this.workLogsService.update(id, dto);
    return { success: true, message: '수정 성공', data, timestamp: new Date().toISOString() };
  }

  @Post('work-logs/:id/settle')
  @ApiOperation({ summary: '근무 수입 수령 처리 (거래 생성)' })
  async settle(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SettleWorkLogDto,
    @Request() req: any,
  ) {
    const data = await this.workLogsService.settle(id, dto, req.user?.userId);
    return { success: true, message: '수령 처리 성공', data, timestamp: new Date().toISOString() };
  }

  @Post('work-logs/:id/unsettle')
  @ApiOperation({ summary: '근무 수입 수령 취소 (거래 삭제)' })
  async unsettle(@Param('id', ParseIntPipe) id: number) {
    const data = await this.workLogsService.unsettle(id);
    return { success: true, message: '수령 취소 성공', data, timestamp: new Date().toISOString() };
  }

  @Post('work-logs/:id/delete')
  @ApiOperation({ summary: '근무 기록 삭제' })
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.workLogsService.delete(id);
    return { success: true, message: '삭제 성공', data: null, timestamp: new Date().toISOString() };
  }
}
