import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { WorklogService } from './worklog.service';
import { FilesService } from '@shared/files/files.service';
import {
  CreateWorklogDto,
  UpdateWorklogDto,
  SearchWorklogDto,
  CreateJobOptionDto,
  CreateCategoryOptionDto,
} from './dto/request';

const ok = (message: string, data: unknown) => ({
  success: true,
  message,
  data,
  timestamp: new Date().toISOString(),
});

@ApiTags('Lab 근무일지')
@Controller('lab/worklog')
export class WorklogController {
  constructor(
    private readonly worklogService: WorklogService,
    private readonly filesService: FilesService,
  ) {}

  @Get()
  @ApiOperation({ summary: '근무 기록 전체 조회' })
  async findAll() {
    return ok('조회 성공', await this.worklogService.findAll());
  }

  @Post('search')
  @ApiOperation({ summary: '월별 조회 + 집계 (근무일수/총액/실수령/수령·미수령)' })
  async search(@Body() dto: SearchWorklogDto) {
    return ok('조회 성공', await this.worklogService.search(dto));
  }

  @Post()
  @ApiOperation({ summary: '근무 기록 추가 (금액 서버 계산)' })
  async create(@Body() dto: CreateWorklogDto) {
    return ok('근무 기록이 추가되었습니다.', await this.worklogService.create(dto));
  }

  @Post(':id/update')
  @ApiOperation({ summary: '근무 기록 수정 (금액 재계산)' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateWorklogDto) {
    return ok('근무 기록이 수정되었습니다.', await this.worklogService.update(id, dto));
  }

  @Post(':id/delete')
  @ApiOperation({ summary: '근무 기록 삭제' })
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.worklogService.delete(id);
    return ok('근무 기록이 삭제되었습니다.', null);
  }

  @Get('job-options')
  @ApiOperation({ summary: '업무 팔레트 조회 (없으면 기본값 자동 시딩)' })
  async getJobOptions() {
    return ok('조회 성공', await this.worklogService.getJobOptions());
  }

  @Post('job-options')
  @ApiOperation({ summary: '업무 팔레트에 항목 추가 (분류별)' })
  async createJobOption(@Body() dto: CreateJobOptionDto) {
    return ok('업무 항목이 추가되었습니다.', await this.worklogService.createJobOption(dto.name, dto.category));
  }

  @Post('job-options/:id/delete')
  @ApiOperation({ summary: '업무 팔레트에서 항목 삭제 (기존 기록의 업무 태그는 유지)' })
  async deleteJobOption(@Param('id', ParseIntPipe) id: number) {
    await this.worklogService.deleteJobOption(id);
    return ok('업무 항목이 삭제되었습니다.', null);
  }

  @Get('category-options')
  @ApiOperation({ summary: '분류 팔레트 조회 (없으면 기본값 자동 시딩)' })
  async getCategoryOptions() {
    return ok('조회 성공', await this.worklogService.getCategoryOptions());
  }

  @Post('category-options')
  @ApiOperation({ summary: '분류 팔레트에 항목 추가' })
  async createCategoryOption(@Body() dto: CreateCategoryOptionDto) {
    return ok('분류가 추가되었습니다.', await this.worklogService.createCategoryOption(dto.name));
  }

  @Post('upload-photos')
  @UseInterceptors(FilesInterceptor('photos', 5))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: '근무 사진 업로드 (최대 5장)' })
  async uploadPhotos(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('업로드할 사진을 선택해주세요.');
    }
    if (files.length > 5) {
      throw new BadRequestException('사진은 최대 5장까지 업로드할 수 있습니다.');
    }
    const results = await Promise.all(files.map((file) => this.filesService.uploadImage(file, 'worklog')));
    const photos = results.map((r) => ({ filename: r.filename, path: r.path, url: r.url }));
    return ok('사진을 업로드했습니다.', { photos });
  }
}
