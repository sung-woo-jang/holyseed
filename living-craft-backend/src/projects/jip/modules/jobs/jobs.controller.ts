import { Body, Controller, Get, Param, Post, Request } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '@common/decorators';
import { JobsService, CreateJobDto } from './jobs.service';
import { JipAuthService } from '../auth/jip-auth.service';

@ApiTags('JIP 시공 일지')
@Controller('jip/jobs')
export class JobsController {
  constructor(
    private readonly jobsService: JobsService,
    private readonly jipAuthService: JipAuthService,
  ) {}

  // 공개 엔드포인트 — 토큰 여부로 admin/guest 분기
  @Get(':id')
  @Public()
  @ApiOperation({ summary: '일지 상세 (로그인 여부에 따라 노출 필드 분기)' })
  async findOne(@Param('id') id: string, @Request() req: any) {
    const authHeader = req.headers?.authorization as string | undefined;
    let isAdmin = false;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const payload = await this.jipAuthService.validateToken(token);
      isAdmin = !!payload;
    }
    const data = await this.jobsService.findPublic(id, isAdmin);
    return { success: true, message: '일지 조회 성공', data, timestamp: new Date().toISOString() };
  }

  @Post('admin/list')
  @ApiOperation({ summary: '[관리자] 일지 목록' })
  async adminList(@Body() body: { q?: string; status?: string }) {
    const data = await this.jobsService.adminList(body.q, body.status);
    return { success: true, message: '일지 목록 조회 성공', data, timestamp: new Date().toISOString() };
  }

  @Get('admin/:id')
  @ApiOperation({ summary: '[관리자] 일지 전체 필드 조회' })
  async adminFindOne(@Param('id') id: string) {
    const data = await this.jobsService.adminFindOne(id);
    return { success: true, message: '일지 상세 조회 성공', data, timestamp: new Date().toISOString() };
  }

  @Post('admin')
  @ApiOperation({ summary: '[관리자] 일지 생성' })
  async create(@Body() dto: CreateJobDto) {
    const data = await this.jobsService.create(dto);
    return { success: true, message: '일지가 생성됐어요', data, timestamp: new Date().toISOString() };
  }

  @Post('admin/:id/update')
  @ApiOperation({ summary: '[관리자] 일지 수정' })
  async update(@Param('id') id: string, @Body() dto: CreateJobDto) {
    const data = await this.jobsService.update(id, dto);
    return { success: true, message: '일지가 수정됐어요', data, timestamp: new Date().toISOString() };
  }

  @Post('admin/:id/delete')
  @ApiOperation({ summary: '[관리자] 일지 삭제' })
  async delete(@Param('id') id: string) {
    await this.jobsService.delete(id);
    return { success: true, message: '일지를 삭제했어요', data: null, timestamp: new Date().toISOString() };
  }

  @Post('admin/:id/publish')
  @ApiOperation({ summary: '[관리자] 공개 토글' })
  async togglePublish(@Param('id') id: string, @Body() body: { isPublished: boolean }) {
    const data = await this.jobsService.togglePublish(id, body.isPublished);
    return { success: true, message: `${body.isPublished ? '공개' : '비공개'}로 변경됐어요`, data, timestamp: new Date().toISOString() };
  }
}
