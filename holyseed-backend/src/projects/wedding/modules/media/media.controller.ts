import { Body, Controller, Get, Param, Post, Request, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { resolve as resolvePath } from 'path';
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
    return res.sendFile(resolvePath(path), {
      // 회전 등으로 같은 id의 파일 내용이 바뀔 수 있어 immutable/1년 캐시는 쓰지 않음 —
      // 1시간마다 브라우저가 재검증(Express sendFile이 mtime/size 기반 ETag를 자동으로 붙여줌)
      headers: { 'Content-Type': mimeType, 'Cache-Control': 'public, max-age=3600' },
    });
  }

  @Get(':id/resized')
  @Public()
  @ApiOperation({ summary: '리사이즈 이미지 (APPROVED)' })
  async resized(@Param('id') id: string, @Res() res: Response) {
    const { path, mimeType } = await this.mediaService.getFilePath(id, 'resized');
    return res.sendFile(resolvePath(path), {
      // 회전 등으로 같은 id의 파일 내용이 바뀔 수 있어 immutable/1년 캐시는 쓰지 않음 —
      // 1시간마다 브라우저가 재검증(Express sendFile이 mtime/size 기반 ETag를 자동으로 붙여줌)
      headers: { 'Content-Type': mimeType, 'Cache-Control': 'public, max-age=3600' },
    });
  }

  @Get(':id/original')
  @Public()
  @ApiOperation({ summary: '원본 파일 (APPROVED)' })
  async original(@Param('id') id: string, @Res() res: Response) {
    const { path, mimeType } = await this.mediaService.getFilePath(id, 'original');
    return res.sendFile(resolvePath(path), {
      // 회전 등으로 같은 id의 파일 내용이 바뀔 수 있어 immutable/1년 캐시는 쓰지 않음 —
      // 1시간마다 브라우저가 재검증(Express sendFile이 mtime/size 기반 ETag를 자동으로 붙여줌)
      headers: { 'Content-Type': mimeType, 'Cache-Control': 'public, max-age=3600' },
    });
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

  @Post(':id/rotate')
  @ApiBearerAuth()
  @ApiOperation({ summary: '이미지 90도 회전 (원본/리사이즈/썸네일 파일을 그대로 덮어씀)' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  async rotate(@Param('id') id: string, @Body('direction') direction: 'cw' | 'ccw' = 'cw', @Request() req: any) {
    const media = await this.mediaService.rotate(id, direction, req.user);
    return {
      success: true,
      message: '이미지가 회전되었습니다.',
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
