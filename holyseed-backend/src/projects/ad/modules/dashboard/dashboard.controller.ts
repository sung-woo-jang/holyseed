import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { MembershipGuard } from '../../common/guards/membership.guard';
import { TimeseriesRangeDto } from './dto/request/timeseries-range.dto';
import { NetWorthAtDto } from './dto/request/net-worth-at.dto';

@ApiTags('AD 대시보드')
@Controller('ad')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('households/:householdId/dashboard')
  @UseGuards(MembershipGuard)
  @ApiOperation({ summary: '대시보드 (순자산 + 60mo 시계열 + 도넛 + 최근거래3)' })
  async getDashboard(@Param('householdId', ParseIntPipe) householdId: number) {
    const data = await this.dashboardService.getDashboard(householdId);
    return { success: true, message: '조회 성공', data, timestamp: new Date().toISOString() };
  }

  @Post('households/:householdId/dashboard/timeseries')
  @UseGuards(MembershipGuard)
  @ApiOperation({ summary: '순자산 시계열 (1Y/3Y/5Y/ALL)' })
  async getTimeseries(@Param('householdId', ParseIntPipe) householdId: number, @Body() dto: TimeseriesRangeDto) {
    const data = await this.dashboardService.getTimeseriesRange(householdId, dto.range);
    return { success: true, message: '조회 성공', data, timestamp: new Date().toISOString() };
  }

  @Post('households/:householdId/net-worth-at')
  @UseGuards(MembershipGuard)
  @ApiOperation({ summary: '기준 날짜 시점의 가구 총자산 조회 (자산별 최신 스냅샷 합산)' })
  async getNetWorthAt(@Param('householdId', ParseIntPipe) householdId: number, @Body() dto: NetWorthAtDto) {
    const data = await this.dashboardService.getNetWorthAt(householdId, dto.date);
    return { success: true, message: '조회 성공', data, timestamp: new Date().toISOString() };
  }
}
