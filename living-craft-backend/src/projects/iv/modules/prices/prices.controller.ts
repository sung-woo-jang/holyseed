import { Controller, Get, Param, Post } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { Public } from '@common/decorators'
import { PricesService } from './prices.service'

const ok = (data: unknown, message = '성공') => ({
  success: true, message, data, timestamp: new Date().toISOString(),
})

@ApiTags('IV 시세')
@Controller('iv/prices')
@Public()
export class PricesController {
  constructor(private readonly svc: PricesService) {}

  @Get(':ticker/latest')
  @ApiOperation({ summary: '최신 종가' })
  async getLatest(@Param('ticker') ticker: string) {
    return ok(await this.svc.getLatest(ticker))
  }

  @Get(':ticker/history')
  @ApiOperation({ summary: '종가 히스토리 (최근 60거래일)' })
  async getHistory(@Param('ticker') ticker: string) {
    return ok(await this.svc.getHistory(ticker, 60))
  }

  @Post(':ticker/refresh')
  @ApiOperation({ summary: '시세 수동 갱신' })
  async refresh(@Param('ticker') ticker: string) {
    const price = await this.svc.fetchAndSave(ticker)
    return ok(price, `${ticker} 시세 갱신 완료`)
  }
}
