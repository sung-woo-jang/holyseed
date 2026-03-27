import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FilesService } from './files.service';
import { SuccessBaseResponseDto } from '@common/dto/response/success-base-response.dto';
import { SwaggerBaseApply } from '@common/decorators/swagger-base-apply.decorator';
import { ERROR_MESSAGES } from '@common/constants';
import { UploadReservationPhotosResponseDto } from './dto/response';

@ApiTags('파일 테스트')
@Controller('files')
@SwaggerBaseApply()
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload/test')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: '단일 파일 업로드 테스트',
    description:
      '테스트용 단일 파일 업로드 엔드포인트입니다. 실제 업로드는 각 도메인 API에서 처리됩니다.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 201,
    description: '파일 업로드 성공',
  })
  async uploadTestFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException(ERROR_MESSAGES.FILES.NOT_SELECTED);
    }

    const result = await this.filesService.uploadImage(file, 'test');
    return new SuccessBaseResponseDto('테스트 파일을 업로드했습니다.', result);
  }

  @Post('upload/test-multiple')
  @UseInterceptors(FilesInterceptor('files', 5))
  @ApiOperation({
    summary: '다중 파일 업로드 테스트',
    description:
      '테스트용 다중 파일 업로드 엔드포인트입니다 (최대 5개). 실제 업로드는 각 도메인 API에서 처리됩니다.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 201,
    description: '파일 업로드 성공',
  })
  async uploadTestFiles(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException(ERROR_MESSAGES.FILES.NOT_SELECTED);
    }

    const results = await Promise.all(
      files.map((file) => this.filesService.uploadImage(file, 'test')),
    );

    return new SuccessBaseResponseDto(
      '테스트 파일들을 업로드했습니다.',
      results,
    );
  }

  @Post('reservations/upload-photos')
  @UseInterceptors(FilesInterceptor('photos', 5))
  @ApiOperation({
    summary: '예약용 사진 업로드',
    description:
      '예약 생성 전 사진을 사전 업로드합니다. 최대 5장까지 업로드 가능합니다.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 201,
    type: UploadReservationPhotosResponseDto,
    description: '사진 업로드 성공',
  })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  async uploadReservationPhotos(
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException(ERROR_MESSAGES.FILES.NOT_SELECTED);
    }
    if (files.length > 5) {
      throw new BadRequestException(
        '사진은 최대 5장까지 업로드할 수 있습니다.',
      );
    }

    const uploadResults = await Promise.all(
      files.map((file) => this.filesService.uploadImage(file, 'reservations')),
    );

    const photos = uploadResults.map((result) => ({
      filename: result.filename,
      path: result.path,
      url: result.url,
    }));

    return new SuccessBaseResponseDto('사진을 업로드했습니다.', { photos });
  }
}
