import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuoteRequest } from '../requests/entities/quote-request.entity';
import { JobsService } from '../jobs/jobs.service';

@ApiTags('JIP 대시보드')
@Controller('jip/dashboard')
export class DashboardController {
  constructor(
    @InjectRepository(QuoteRequest) private readonly reqRepo: Repository<QuoteRequest>,
    private readonly jobsService: JobsService,
  ) {}

  @Get()
  @ApiOperation({ summary: '[관리자] 대시보드 통계' })
  async getDashboard() {
    const allReqs = await this.reqRepo.find({ relations: ['items'], order: { id: 'DESC' }, take: 6 });
    const pending = allReqs.filter((r) => r.status === 'pending').length;
    const inProgress = allReqs.filter((r) => r.status === 'in_progress' || r.status === 'accepted').length;
    const revenue = await this.jobsService.monthlyRevenue();

    return {
      success: true,
      message: '대시보드 조회 성공',
      data: { pending, inProgress, monthlyRevenue: revenue, recentRequests: allReqs },
      timestamp: new Date().toISOString(),
    };
  }
}
