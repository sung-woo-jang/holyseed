import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { BacktestService } from './backtest.service';
import { GetPricesDto } from './dto/request';

const ok = (message: string, data: unknown) => ({
  success: true,
  message,
  data,
  timestamp: new Date().toISOString(),
});

@ApiTags('Lab Backtest')
@Controller('lab/backtest')
export class BacktestController {
  constructor(private readonly backtestService: BacktestService) {}

  @Post('prices')
  @ApiOperation({ summary: '백테스트용 종목 일봉 종가 조회 (없으면 토스 API로 채운 뒤 캐시)' })
  async getPrices(@Body() dto: GetPricesDto) {
    const prices = await this.backtestService.getPrices(dto.symbol, dto.years);
    return ok('조회 성공', prices);
  }
}
