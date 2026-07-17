import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SavingService } from './saving.service';
import { CreateRecordDto, UpdateRecordDto, PlanDto } from './dto/request';

const ok = (message: string, data: unknown) => ({
  success: true,
  message,
  data,
  timestamp: new Date().toISOString(),
});

@ApiTags('Lab 저축')
@Controller('lab/saving')
export class SavingController {
  constructor(private readonly savingService: SavingService) {}

  @Get('records')
  @ApiOperation({ summary: '월별 저축 기록 전체' })
  async findAll() {
    return ok('조회 성공', await this.savingService.findAll());
  }

  @Get('summary')
  @ApiOperation({ summary: '1억 목표 진행 요약' })
  async getSummary() {
    return ok('조회 성공', await this.savingService.getSummary());
  }

  @Post('plan')
  @ApiOperation({ summary: '저축 계획 미리보기 (저장 안 함)' })
  async plan(@Body() dto: PlanDto) {
    return ok('계산 성공', this.savingService.computePlan(dto.income));
  }

  @Post('records')
  @ApiOperation({ summary: '월별 기록 등록/갱신 (yearMonth upsert)' })
  async createOrUpdate(@Body() dto: CreateRecordDto) {
    return ok('저축 기록이 저장되었습니다.', await this.savingService.createOrUpdate(dto));
  }

  @Post('records/:id/update')
  @ApiOperation({ summary: '기록 수정' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRecordDto) {
    return ok('저축 기록이 수정되었습니다.', await this.savingService.update(id, dto));
  }

  @Post('records/:id/delete')
  @ApiOperation({ summary: '기록 삭제' })
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.savingService.delete(id);
    return ok('저축 기록이 삭제되었습니다.', null);
  }
}
