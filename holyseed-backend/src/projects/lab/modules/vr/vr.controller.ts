import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, Sse } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { VrService } from './vr.service';
import { VrEngineService } from './services/vr-engine.service';
import { VrStatusService } from './services/vr-status.service';
import { CreateFillDto, CreateCycleDto, RolloverCycleDto, UpdateSettingsDto, VrRunRequestDto } from './dto/request';

const ok = (message: string, data: unknown) => ({
  success: true,
  message,
  data,
  timestamp: new Date().toISOString(),
});

@ApiTags('Lab VR')
@Controller('lab/vr')
export class VrController {
  constructor(
    private readonly vrService: VrService,
    private readonly engine: VrEngineService,
    private readonly status: VrStatusService,
  ) {}

  @Get('state')
  @ApiOperation({ summary: 'VR 종합 상태 (V/밴드/Pool/보유/평단/파생값)' })
  async getState() {
    return ok('조회 성공', await this.vrService.getState());
  }

  @Get('price')
  @ApiOperation({ summary: 'TQQQ 실시간 시세 (60초 캐시)' })
  async getPrice() {
    return ok('조회 성공', await this.status.getPrice());
  }

  @Get('cash-balance')
  @ApiOperation({ summary: '실제 계좌 예수금 중 VR 몫 (라오어 몫 제외, 5분 캐시)' })
  async getCashBalance() {
    return ok('조회 성공', await this.status.getCashBalance());
  }

  @Get('status')
  @ApiOperation({ summary: '엔진 상태 + 사이클 + 이벤트 + 활성 세션 + 시장 캘린더' })
  async getStatus() {
    return ok('조회 성공', await this.status.getStatus());
  }

  @Get('events')
  @ApiOperation({ summary: '이벤트 페이지네이션 (cursor, level)' })
  async getEvents(@Query('cursor') cursor = '0', @Query('level') level = 'all') {
    return ok('조회 성공', await this.status.getEvents(Number(cursor) || 0, level));
  }

  @Get('candles')
  @ApiOperation({ summary: 'TQQQ 캔들 (range: 1m|3m|all|intraday, 5분 캐시)' })
  async getCandles(@Query('range') range = '3m') {
    return ok('조회 성공', await this.status.getCandles(range));
  }

  @Post('run')
  @ApiOperation({ summary: '엔진 수동 실행 (live=false면 dry-run, 시간창 항상 생략)' })
  async run(@Body() dto: VrRunRequestDto) {
    const lines = await this.engine.run({ live: dto.live === true, force: true });
    return ok('실행 완료', { lines });
  }

  @Sse('stream')
  stream(): Observable<MessageEvent> {
    return new Observable((subscriber) => {
      let lastSig = '';
      let closed = false;
      let lastBeat = Date.now();

      const tick = async () => {
        try {
          const sig = await this.status.getChangeSignature();
          if (sig !== lastSig) {
            lastSig = sig;
            const data = await this.status.getStatus();
            subscriber.next({ type: 'status', data: JSON.stringify(data) } as MessageEvent);
            lastBeat = Date.now();
          } else if (Date.now() - lastBeat > 30_000) {
            subscriber.next({
              type: 'heartbeat',
              data: JSON.stringify({ now: new Date().toISOString() }),
            } as MessageEvent);
            lastBeat = Date.now();
          }
        } catch {
          /* 다음 틱에 재시도 */
        }
        if (!closed) timer = setTimeout(tick, 2000);
      };

      let timer = setTimeout(tick, 0);
      return () => {
        closed = true;
        clearTimeout(timer);
      };
    });
  }

  @Get('fills')
  @ApiOperation({ summary: '체결 이력 전체' })
  async getFills() {
    return ok('조회 성공', await this.vrService.findAllFills());
  }

  @Get('cycles')
  @ApiOperation({ summary: '사이클 히스토리 전체' })
  async getCycles() {
    return ok('조회 성공', await this.vrService.findAllCycles());
  }

  @Post('fills')
  @ApiOperation({ summary: '체결 등록 (Pool/보유/평단 자동 계산)' })
  async createFill(@Body() dto: CreateFillDto) {
    return ok('체결이 등록되었습니다.', await this.vrService.createFill(dto));
  }

  @Post('fills/:id/delete')
  @ApiOperation({ summary: '체결 삭제 (스냅샷 전체 재계산)' })
  async deleteFill(@Param('id', ParseIntPipe) id: number) {
    await this.vrService.deleteFill(id);
    return ok('체결이 삭제되었습니다.', null);
  }

  @Post('cycles')
  @ApiOperation({ summary: '사이클 수동 등록 (임포트/초기 세팅용)' })
  async createCycle(@Body() dto: CreateCycleDto) {
    return ok('사이클이 등록되었습니다.', await this.vrService.createCycle(dto));
  }

  @Post('cycles/rollover')
  @ApiOperation({ summary: 'V 갱신 실행 (현 사이클 종료 → V₂ → 새 사이클)' })
  async rollover(@Body() dto: RolloverCycleDto) {
    return ok('V 갱신이 완료되었습니다.', await this.vrService.rollover(dto));
  }

  @Post('settings/update')
  @ApiOperation({ summary: 'VR 설정 수정' })
  async updateSettings(@Body() dto: UpdateSettingsDto) {
    return ok('설정이 수정되었습니다.', await this.vrService.updateSettings(dto));
  }
}
