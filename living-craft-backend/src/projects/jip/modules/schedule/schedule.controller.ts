import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '@common/decorators';
import { ScheduleService } from './schedule.service';
import { SlotStatus } from './entities/tech-schedule.entity';

@ApiTags('JIP 일정')
@Controller('jip/schedule')
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: '60일 일정 가용성 조회 (고객용)' })
  async get60Days() {
    const data = await this.scheduleService.get60Days();
    return { success: true, message: '일정 조회 성공', data, timestamp: new Date().toISOString() };
  }

  @Post('admin/:date')
  @ApiOperation({ summary: '[관리자] 날짜 일정 업데이트' })
  async updateDay(
    @Param('date') date: string,
    @Body() body: { am?: SlotStatus; noon?: SlotStatus; pm?: SlotStatus; eve?: SlotStatus; note?: string },
  ) {
    const { note, ...slots } = body;
    const data = await this.scheduleService.updateDay(date, slots, note);
    return { success: true, message: '일정 업데이트 성공', data, timestamp: new Date().toISOString() };
  }
}
