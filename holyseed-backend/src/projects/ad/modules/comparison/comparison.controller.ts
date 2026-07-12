import { Controller, Get, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ComparisonService } from './comparison.service';
import { MembershipGuard } from '../../common/guards/membership.guard';

@ApiTags('AD 연간 비교')
@Controller('ad')
export class ComparisonController {
  constructor(private readonly comparisonService: ComparisonService) {}

  @Get('households/:householdId/comparison/yearly')
  @UseGuards(MembershipGuard)
  @ApiOperation({ summary: '연간 순자산 비교 (5년 워터폴 + 자산군 기여)' })
  async getYearly(@Param('householdId', ParseIntPipe) householdId: number) {
    const data = await this.comparisonService.getYearlyComparison(householdId);
    return { success: true, message: '조회 성공', data, timestamp: new Date().toISOString() };
  }
}
