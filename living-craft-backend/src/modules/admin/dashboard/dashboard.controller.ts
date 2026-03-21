import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@modules/admin/auth';
import { DashboardService } from './dashboard.service';

@ApiTags('Admin - Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: '대시보드 통계 조회' })
  async getStats() {
    const data = await this.dashboardService.getStats();

    return {
      success: true,
      message: '대시보드 통계를 조회했습니다.',
      data,
      timestamp: new Date().toISOString(),
    };
  }
}
