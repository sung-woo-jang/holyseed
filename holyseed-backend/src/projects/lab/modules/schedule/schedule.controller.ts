import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ScheduleService } from './schedule.service';
import { CreateScheduleDto, UpdateScheduleDto, SearchScheduleDto } from './dto/request';

const ok = (message: string, data: unknown) => ({
  success: true,
  message,
  data,
  timestamp: new Date().toISOString(),
});

@ApiTags('Lab 일정')
@Controller('lab/schedules')
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Get()
  @ApiOperation({ summary: '일정 전체 조회' })
  async findAll() {
    return ok('조회 성공', await this.scheduleService.findAll());
  }

  @Post('search')
  @ApiOperation({ summary: '기간 조회 (캘린더 월 범위, 기간 일정 겹침 포함)' })
  async search(@Body() dto: SearchScheduleDto) {
    return ok('조회 성공', await this.scheduleService.search(dto));
  }

  @Post()
  @ApiOperation({ summary: '일정 등록' })
  async create(@Body() dto: CreateScheduleDto) {
    return ok('일정이 등록되었습니다.', await this.scheduleService.create(dto));
  }

  @Post(':id/update')
  @ApiOperation({ summary: '일정 수정' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateScheduleDto) {
    return ok('일정이 수정되었습니다.', await this.scheduleService.update(id, dto));
  }

  @Post(':id/delete')
  @ApiOperation({ summary: '일정 삭제' })
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.scheduleService.delete(id);
    return ok('일정이 삭제되었습니다.', null);
  }
}
