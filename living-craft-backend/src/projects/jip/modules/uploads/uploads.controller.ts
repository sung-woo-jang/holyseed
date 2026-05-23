import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FilesService } from '@shared/files/files.service';
import { Public } from '@common/decorators';

@ApiTags('JIP 파일 업로드')
@Controller('jip/uploads')
export class UploadsController {
  constructor(private readonly filesService: FilesService) {}

  private async uploadPhoto(file: Express.Multer.File, subfolder: string) {
    if (!file) throw new BadRequestException('파일을 선택해주세요.');
    const result = await this.filesService.uploadImage(file, subfolder, 1200, 85);
    return { url: result.url, path: result.path, filename: result.filename };
  }

  @Post('job-photo')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: '시공일지 사진 업로드' })
  async uploadJobPhoto(@UploadedFile() file: Express.Multer.File) {
    const data = await this.uploadPhoto(file, 'jip/jobs');
    return { success: true, message: '사진 업로드 성공', data, timestamp: new Date().toISOString() };
  }

  @Post('request-photo')
  @Public()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: '견적요청 첨부 사진 업로드' })
  async uploadRequestPhoto(@UploadedFile() file: Express.Multer.File) {
    const data = await this.uploadPhoto(file, 'jip/requests');
    return { success: true, message: '사진 업로드 성공', data, timestamp: new Date().toISOString() };
  }

  @Post('case-photo')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: '시공사례 사진 업로드' })
  async uploadCasePhoto(@UploadedFile() file: Express.Multer.File) {
    const data = await this.uploadPhoto(file, 'jip/cases');
    return { success: true, message: '사진 업로드 성공', data, timestamp: new Date().toISOString() };
  }
}
