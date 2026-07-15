import { Body, Controller, Get, Post, Query, Sse, UseGuards } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { Observable } from 'rxjs'
import { Public } from '@common/decorators'
import { LaofusKeyGuard } from './laofus-key.guard'
import { LaofusStatusService } from './services/status.service'
import { LaofusEngineService } from './services/engine.service'
import { LaofusRunRequestDto } from './dto/run-request.dto'

function ok<T>(data: T, message = '조회 성공') {
  return { success: true, message, data, timestamp: new Date().toISOString() }
}

@ApiTags('LAOFUS 무한매수법')
@Public()
@UseGuards(LaofusKeyGuard)
@Controller('laofus')
export class LaofusController {
  constructor(
    private readonly status: LaofusStatusService,
    private readonly engine: LaofusEngineService
  ) {}

  @Get('status')
  @ApiOperation({ summary: '엔진 상태 + 사이클/거래 + 이벤트 + 시장 캘린더' })
  async getStatus() {
    return ok(await this.status.getStatus())
  }

  @Get('price')
  @ApiOperation({ summary: 'SOXL 현재가 (60초 캐시)' })
  async getPrice() {
    return ok(await this.status.getPrice())
  }

  @Get('candles')
  @ApiOperation({ summary: 'SOXL 캔들 (range: 1m|3m|all|intraday, 5분 캐시)' })
  async getCandles(@Query('range') range = '3m') {
    return ok(await this.status.getCandles(range))
  }

  @Get('account')
  @ApiOperation({ summary: '실계좌 (보유 전체 + 예수금 + 환율, 60초 캐시)' })
  async getAccount() {
    return ok(await this.status.getAccount())
  }

  @Get('orders')
  @ApiOperation({ summary: '주문 내역 (OPEN 전체 + CLOSED 최근 20건, 60초 캐시)' })
  async getOrders() {
    return ok(await this.status.getOrders())
  }

  @Get('order')
  @ApiOperation({ summary: '주문 단건 상세 (orderId 쿼리, 거래 상세 페이지용)' })
  async getOrder(@Query('orderId') orderId = '') {
    return ok(await this.status.getOrder(orderId))
  }

  @Get('events')
  @ApiOperation({ summary: '이벤트 페이지네이션 (cursor, level)' })
  async getEvents(@Query('cursor') cursor = '0', @Query('level') level = 'all') {
    return ok(await this.status.getEvents(Number(cursor) || 0, level))
  }

  @Post('run')
  @ApiOperation({ summary: '엔진 수동 실행 (live=false면 dry-run, force로 시간창 생략)' })
  async run(@Body() dto: LaofusRunRequestDto) {
    const lines = await this.engine.run({
      live: dto.live === true,
      force: true, // 수동 실행은 항상 시간창 생략
      injectedPrice: typeof dto.price === 'number' && dto.live !== true ? dto.price : null,
    })
    return ok({ lines }, '실행 완료')
  }

  @Sse('stream')
  stream(): Observable<MessageEvent> {
    return new Observable((subscriber) => {
      let lastSig = ''
      let closed = false
      let lastBeat = Date.now()

      const tick = async () => {
        try {
          const sig = await this.status.getChangeSignature()
          if (sig !== lastSig) {
            lastSig = sig
            const data = await this.status.getStatus()
            subscriber.next({ type: 'status', data: JSON.stringify(data) } as MessageEvent)
            lastBeat = Date.now()
          } else if (Date.now() - lastBeat > 30_000) {
            subscriber.next({ type: 'heartbeat', data: JSON.stringify({ now: new Date().toISOString() }) } as MessageEvent)
            lastBeat = Date.now()
          }
        } catch {
          /* 다음 틱에 재시도 */
        }
        if (!closed) timer = setTimeout(tick, 2000)
      }

      let timer = setTimeout(tick, 0)
      return () => {
        closed = true
        clearTimeout(timer)
      }
    })
  }
}
