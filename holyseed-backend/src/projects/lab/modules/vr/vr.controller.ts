import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { VrService } from './vr.service';
import { CreateFillDto, CreateCycleDto, RolloverCycleDto, UpdateSettingsDto } from './dto/request';

const ok = (message: string, data: unknown) => ({
  success: true,
  message,
  data,
  timestamp: new Date().toISOString(),
});

@ApiTags('Lab VR')
@Controller('lab/vr')
export class VrController {
  constructor(private readonly vrService: VrService) {}

  @Get('state')
  @ApiOperation({ summary: 'VR 종합 상태 (V/밴드/Pool/보유/평단/파생값)' })
  async getState() {
    return ok('조회 성공', await this.vrService.getState());
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
