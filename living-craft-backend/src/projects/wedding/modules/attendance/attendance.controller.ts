import { Body, Controller, Param, Post, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '@common/decorators/public.decorator';
import { AttendanceService } from './attendance.service';
import { CreateAttendanceDto } from './dto/request/create-attendance.dto';
import { SearchAttendanceDto } from './dto/request/search-attendance.dto';

@ApiTags('Wedding 참석 응답')
@Controller('wedding/attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post()
  @Public()
  @ApiOperation({ summary: 'RSVP 제출 (하객 공개)' })
  @ApiResponse({ status: 201, description: '참석 응답 등록 성공' })
  async create(@Body() dto: CreateAttendanceDto) {
    const data = await this.attendanceService.create(dto);
    return {
      success: true,
      message: '참석 응답이 등록되었습니다.',
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('search')
  @ApiBearerAuth()
  @ApiOperation({ summary: '참석 목록 + 통계 조회 (관리자)' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  async search(@Body() dto: SearchAttendanceDto, @Request() req: any) {
    const data = await this.attendanceService.search(dto, req.user);
    return {
      success: true,
      message: '참석 목록 조회 성공',
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Post(':id/delete')
  @ApiBearerAuth()
  @ApiOperation({ summary: '참석 기록 삭제 (관리자)' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  async delete(@Param('id') id: string, @Request() req: any) {
    await this.attendanceService.delete(id, req.user);
    return {
      success: true,
      message: '참석 기록이 삭제되었습니다.',
      data: null,
      timestamp: new Date().toISOString(),
    };
  }
}
