import { OwnerOnly } from '@common/decorators';
import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { DEFAULT_SYMBOL, SpacexService } from './spacex.service';
import { CreateSpacexEntryDto, CloseInvestmentDto, UpsertDcaPlanDto } from './dto/request';

const ok = (message: string, data: unknown) => ({
  success: true,
  message,
  data,
  timestamp: new Date().toISOString(),
});

const symbolOf = (s?: string) => (s ? s.trim().toUpperCase() : DEFAULT_SYMBOL);

/** 모으기(스페이스X·UPRO …) — 경로는 처음 이름 그대로 /ad/spacex (nginx가 :8001로 보냄). symbol을 안 주면 SPCX */
@ApiTags('모으기 (스페이스X·UPRO)')
@OwnerOnly()
@Controller('ad/spacex')
export class SpacexController {
  constructor(private readonly spacexService: SpacexService) {}

  @Get('overview')
  @ApiOperation({ summary: '모으기 전체 — 종목별 원금·평가금·최근 주문 + 주별 누적 원금' })
  async getOverview() {
    return ok('조회 성공', await this.spacexService.getOverview());
  }

  @Get('entries')
  @ApiOperation({ summary: '전 종목 매수 기록 (최신순)' })
  async getEntries() {
    return ok('조회 성공', await this.spacexService.getEntries());
  }

  @Get('plans')
  @ApiOperation({ summary: '모으기 계획 목록' })
  async getPlans() {
    return ok('조회 성공', await this.spacexService.getPlans());
  }

  @Post('plans')
  @ApiOperation({ summary: '모으기 계획 추가·수정 (종목 기준) — 앱 UI 없음, 프롬프트/API 전용' })
  async upsertPlan(@Body() dto: UpsertDcaPlanDto) {
    return ok('저장되었습니다.', await this.spacexService.upsertPlan(dto));
  }

  @Get('status')
  @ApiQuery({ name: 'symbol', required: false, example: 'UPRO' })
  @ApiOperation({ summary: '종목 하나의 기록 전체 + 집계 (총 원금/평단/수익률)' })
  async getStatus(@Query('symbol') symbol?: string) {
    return ok('조회 성공', await this.spacexService.getStatus(symbolOf(symbol)));
  }

  @Get('candles')
  @ApiQuery({ name: 'symbol', required: false, example: 'UPRO' })
  @ApiOperation({ summary: '일봉 (range: all|1m|2w, 5분 캐시) — SPCX는 상장가·상장 후 고점/저점 포함' })
  async getCandles(@Query('range') range = 'all', @Query('symbol') symbol?: string) {
    return ok('조회 성공', await this.spacexService.getCandles(range, symbolOf(symbol)));
  }

  @Post('entries')
  @ApiOperation({ summary: '기록 추가 (매수/리밸런싱 공용 — 프롬프트/API 전용, 앱 UI 없음)' })
  async createEntry(@Body() dto: CreateSpacexEntryDto) {
    return ok('기록이 추가되었습니다.', await this.spacexService.createEntry(dto));
  }

  @Post('close')
  @ApiOperation({ summary: '모으기 종료 처리 (symbol 생략 시 SPCX)' })
  async close(@Body() dto: CloseInvestmentDto) {
    return ok('모으기를 종료 처리했습니다.', await this.spacexService.close(dto.date, symbolOf(dto.symbol)));
  }

  @Post('sync')
  @ApiOperation({ summary: '모든 모으기 종목의 토스 체결 내역 즉시 동기화 (매일 09:10 자동으로도 돎)' })
  async sync() {
    return ok('동기화 완료', await this.spacexService.syncFromToss());
  }
}
