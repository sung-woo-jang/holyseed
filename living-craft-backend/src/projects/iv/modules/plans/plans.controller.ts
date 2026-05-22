import { Body, Controller, Get, Param, Post } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { Public } from '@common/decorators'
import { PlansService } from './plans.service'

const ok = (data: unknown, message = '성공') => ({
  success: true, message, data, timestamp: new Date().toISOString(),
})

@ApiTags('IV 계획')
@Controller('iv/strategies')
@Public()
export class PlansController {
  constructor(private readonly svc: PlansService) {}

  @Get(':id/plans/today')
  @ApiOperation({ summary: '오늘 LOC 계획' })
  async today(@Param('id') id: string) {
    return ok(await this.svc.getTodayPlan(id))
  }

  @Post(':id/plans/by-date')
  @ApiOperation({ summary: '날짜별 계획' })
  async byDate(@Param('id') id: string, @Body() body: { date: string }) {
    return ok(await this.svc.getPlanByDate(id, body.date))
  }
}
