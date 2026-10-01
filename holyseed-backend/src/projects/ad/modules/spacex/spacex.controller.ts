import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SpacexService } from './spacex.service';
import { CreateSpacexEntryDto, CloseInvestmentDto } from './dto/request';

const ok = (message: string, data: unknown) => ({
  success: true,
  message,
  data,
  timestamp: new Date().toISOString(),
});

@ApiTags('스페이스X')
@Controller('ad/spacex')
export class SpacexController {
  constructor(private readonly spacexService: SpacexService) {}

  @Get('status')
  @ApiOperation({ summary: '스페이스X 기록 전체 조회 + 집계 (총 원금/평단/수익률)' })
  async getStatus() {
    return ok('조회 성공', await this.spacexService.getStatus());
  }

  @Post('entries')
  @ApiOperation({ summary: '기록 추가 (매수/리밸런싱 공용 — 프롬프트/API 전용, 앱 UI 없음)' })
  async createEntry(@Body() dto: CreateSpacexEntryDto) {
    return ok('기록이 추가되었습니다.', await this.spacexService.createEntry(dto));
  }

  @Post('close')
  @ApiOperation({ summary: '투자 종료 처리' })
  async close(@Body() dto: CloseInvestmentDto) {
    return ok('투자 종료 처리되었습니다.', await this.spacexService.close(dto.date));
  }

  @Post('sync')
  @ApiOperation({ summary: '토스 SPCX 체결 내역 즉시 동기화 (매일 자동으로도 돎, 수동 즉시 반영용)' })
  async sync() {
    return ok('동기화 완료', await this.spacexService.syncFromToss());
  }
}
