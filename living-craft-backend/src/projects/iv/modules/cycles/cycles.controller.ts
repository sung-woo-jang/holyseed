import { Body, Controller, Param, Post } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { CyclesService } from './cycles.service'

const ok = (data: unknown, message = '성공') => ({
  success: true, message, data, timestamp: new Date().toISOString(),
})

@ApiTags('IV 사이클')
@Controller('iv/strategies')
export class CyclesController {
  constructor(private readonly svc: CyclesService) {}

  @Post(':id/cycles/start-next')
  @ApiOperation({ summary: '새 사이클 시작 (복리/단리)' })
  async startNext(@Param('id') id: string, @Body() body: { mode: 'compound' | 'simple' }) {
    return ok(await this.svc.startNext(id, body.mode), '새 사이클이 시작되었습니다.')
  }

  @Post(':id/cycles/force-end')
  @ApiOperation({ summary: '현재 사이클 강제 종료' })
  async forceEnd(@Param('id') id: string) {
    await this.svc.forceEnd(id)
    return ok(null, '사이클이 강제 종료되었습니다.')
  }
}
