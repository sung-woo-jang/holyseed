import { Body, Controller, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Public } from '@common/decorators';
import { CasesService } from './cases.service';
import { CreateCaseDto } from './dto/create-case.dto';

@ApiTags('JIP 시공사례')
@Controller('jip/cases')
export class CasesController {
  constructor(private readonly casesService: CasesService) {}

  // ===== 공개 엔드포인트 =====

  @Get()
  @Public()
  @ApiOperation({ summary: '시공사례 목록' })
  @ApiQuery({ name: 'tag', required: false })
  async findAll(@Query('tag') tag?: string) {
    const data = await this.casesService.findAll(tag);
    return { success: true, message: '시공사례 목록 조회 성공', data, timestamp: new Date().toISOString() };
  }

  @Get('recent')
  @Public()
  @ApiOperation({ summary: '최근 시공사례 (홈페이지용)' })
  async findRecent() {
    const data = await this.casesService.findRecent(3);
    return { success: true, message: '최근 시공사례 조회 성공', data, timestamp: new Date().toISOString() };
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: '시공사례 상세' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const data = await this.casesService.findOne(id);
    return { success: true, message: '시공사례 상세 조회 성공', data, timestamp: new Date().toISOString() };
  }

  // ===== 관리자 엔드포인트 =====

  @Post('admin/list')
  @ApiOperation({ summary: '[관리자] 시공사례 목록 (비공개 포함)' })
  async adminList() {
    const data = await this.casesService.adminList();
    return { success: true, message: '시공사례 목록 조회 성공', data, timestamp: new Date().toISOString() };
  }

  @Get('admin/:id')
  @ApiOperation({ summary: '[관리자] 시공사례 단건' })
  async adminGet(@Param('id', ParseIntPipe) id: number) {
    const data = await this.casesService.adminGet(id);
    return { success: true, message: '시공사례 조회 성공', data, timestamp: new Date().toISOString() };
  }

  @Post('admin')
  @ApiOperation({ summary: '[관리자] 시공사례 생성' })
  async create(@Body() dto: CreateCaseDto) {
    const data = await this.casesService.create(dto);
    return { success: true, message: '시공사례가 등록됐어요', data, timestamp: new Date().toISOString() };
  }

  @Post('admin/:id/update')
  @ApiOperation({ summary: '[관리자] 시공사례 수정' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: CreateCaseDto) {
    const data = await this.casesService.update(id, dto);
    return { success: true, message: '시공사례가 수정됐어요', data, timestamp: new Date().toISOString() };
  }

  @Post('admin/:id/delete')
  @ApiOperation({ summary: '[관리자] 시공사례 삭제' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.casesService.remove(id);
    return { success: true, message: '시공사례를 삭제했어요', data: null, timestamp: new Date().toISOString() };
  }

  @Post('admin/:id/publish')
  @ApiOperation({ summary: '[관리자] 공개/비공개 토글' })
  async togglePublish(@Param('id', ParseIntPipe) id: number, @Body() body: { isPublished: boolean }) {
    const data = await this.casesService.togglePublish(id, body.isPublished);
    return { success: true, message: `${body.isPublished ? '공개' : '비공개'}로 변경됐어요`, data, timestamp: new Date().toISOString() };
  }
}
