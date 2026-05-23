import { Body, Controller, Get, Param, Post, Request } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '@common/decorators';
import { RequestsService, CreateRequestDto, LookupRequestDto } from './requests.service';

@ApiTags('JIP 견적 요청')
@Controller('jip/requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Post()
  @Public()
  @ApiOperation({ summary: '견적 요청 생성' })
  async create(@Body() dto: CreateRequestDto) {
    const data = await this.requestsService.create(dto);
    return { success: true, message: '견적 요청이 접수됐어요', data, timestamp: new Date().toISOString() };
  }

  @Post('lookup')
  @Public()
  @ApiOperation({ summary: '전화번호로 예약 조회' })
  async lookup(@Body() dto: LookupRequestDto) {
    const data = await this.requestsService.lookup(dto.phone);
    return { success: true, message: '조회 성공', data, timestamp: new Date().toISOString() };
  }

  @Get(':code')
  @Public()
  @ApiOperation({ summary: '요청 코드로 상세 조회' })
  async findByCode(@Param('code') code: string) {
    const data = await this.requestsService.findByCode(code);
    return { success: true, message: '상세 조회 성공', data, timestamp: new Date().toISOString() };
  }

  @Post(':code/cancel')
  @Public()
  @ApiOperation({ summary: '요청 취소 (고객)' })
  async cancel(@Param('code') code: string) {
    const data = await this.requestsService.cancel(code);
    return { success: true, message: '요청을 취소했어요', data, timestamp: new Date().toISOString() };
  }

  @Post('admin/list')
  @ApiOperation({ summary: '[관리자] 요청 목록' })
  async adminList(@Body() body: { status?: string }) {
    const data = await this.requestsService.adminList(body.status as any);
    return { success: true, message: '관리자 요청 목록', data, timestamp: new Date().toISOString() };
  }

  @Post(':code/status')
  @ApiOperation({ summary: '[관리자] 상태 변경' })
  async updateStatus(@Param('code') code: string, @Body() body: { status: string }) {
    const data = await this.requestsService.updateStatus(code, body.status as any);
    return { success: true, message: '상태가 업데이트됐어요', data, timestamp: new Date().toISOString() };
  }
}
