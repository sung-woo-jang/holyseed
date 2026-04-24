import { Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { StatsService } from './stats.service';

@Controller('zc/stats')
@ApiTags('ZC 통계')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Post('overview')
  @ApiOperation({ summary: '전체 통계 조회' })
  @ApiResponse({ status: 200, description: '통계 조회 성공' })
  async getOverview() {
    const data = await this.statsService.getOverview();
    return {
      success: true,
      message: '통계 조회 성공',
      data,
      timestamp: new Date().toISOString(),
    };
  }
}
