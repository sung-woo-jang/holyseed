import { Body, Controller, Get, Param, Post, Request, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { Public } from '@common/decorators/public.decorator';
import { MediaService } from './media.service';
import { SearchMediaDto } from './dto/request/search-media.dto';
import { ModerateMediaDto } from './dto/request/moderate-media.dto';

@ApiTags('Wedding 미디어')
@Controller('wedding/media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('search')
  @Public()
  @ApiOperation({ summary: '미디어 목록 조회 (공개)' })
  async search(@Body() dto: SearchMediaDto) {
    const data = await this.mediaService.search(dto);
    return {
      success: true,
      message: '미디어 목록 조회 성공',
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('upload')
  @Public()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: '미디어 업로드 (공개, 하객용 — PENDING 상태로 생성)' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 * 1024 }, // 5GB
    }),
  )
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body('coupleId') coupleId: string,
    @Body('uploaderName') uploaderName?: string,
    @Body('message') message?: string,
  ) {
    const media = await this.mediaService.upload(file, coupleId, uploaderName, message);
    return {
      success: true,
      message: '업로드 성공',
      data: { ...media, fileSize: Number(media.fileSize) },
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':id/thumbnail')
  @Public()
  @ApiOperation({ summary: '썸네일 이미지 (공개)' })
  async thumbnail(@Param('id') id: string, @Res() res: Response) {
    const { path, mimeType } = await this.mediaService.getFilePath(id, 'thumbnail');
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    return res.sendFile(path, { root: '.' });
  }

  @Get(':id/resized')
  @Public()
  @ApiOperation({ summary: '리사이즈 이미지 (APPROVED)' })
  async resized(@Param('id') id: string, @Res() res: Response) {
    const { path, mimeType } = await this.mediaService.getFilePath(id, 'resized');
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    return res.sendFile(path, { root: '.' });
  }

  @Get(':id/original')
  @Public()
  @ApiOperation({ summary: '원본 파일 (APPROVED)' })
  async original(@Param('id') id: string, @Res() res: Response) {
    const { path, mimeType } = await this.mediaService.getFilePath(id, 'original');
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    return res.sendFile(path, { root: '.' });
  }

  @Post(':id/moderate')
  @ApiBearerAuth()
  @ApiOperation({ summary: '미디어 검수 (승인/거부)' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  async moderate(@Param('id') id: string, @Body() dto: ModerateMediaDto, @Request() req: any) {
    const media = await this.mediaService.moderate(id, dto, req.user);
    return {
      success: true,
      message: '검수 상태가 변경되었습니다.',
      data: { ...media, fileSize: Number(media.fileSize) },
      timestamp: new Date().toISOString(),
    };
  }

  @Post(':id/delete')
  @ApiBearerAuth()
  @ApiOperation({ summary: '미디어 삭제' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  async delete(@Param('id') id: string, @Request() req: any) {
    await this.mediaService.delete(id, req.user);
    return {
      success: true,
      message: '미디어가 삭제되었습니다.',
      data: null,
      timestamp: new Date().toISOString(),
    };
  }
}
