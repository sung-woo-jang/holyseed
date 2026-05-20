import {
  Body,
  Controller,
  Param,
  ParseIntPipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProductImagesService } from './product-images.service';
import { FilesService } from '@shared/files/files.service';

@ApiTags('PC 제품 이미지')
@Controller('pc/products')
export class ProductImagesController {
  constructor(
    private readonly productImagesService: ProductImagesService,
    private readonly filesService: FilesService,
  ) {}

  @Post(':id/images/upload')
  @ApiOperation({ summary: '제품 이미지 업로드' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @Param('id', ParseIntPipe) productId: number,
    @UploadedFile() file: Express.Multer.File,
    @Body('isPrimary') isPrimary?: string,
    @Body('sortOrder') sortOrder?: string,
  ) {
    const data = await this.productImagesService.upload(
      productId,
      file,
      isPrimary === 'true',
      sortOrder ? parseInt(sortOrder, 10) : 0,
    );
    return { success: true, message: '이미지 업로드 성공', data, timestamp: new Date().toISOString() };
  }

  @Post(':productId/images/:imageId/set-primary')
  @ApiOperation({ summary: '대표 이미지 변경' })
  async setPrimary(@Param('imageId', ParseIntPipe) imageId: number) {
    await this.productImagesService.setPrimary(imageId);
    return { success: true, message: '대표 이미지 변경 성공', data: null, timestamp: new Date().toISOString() };
  }

  @Post(':productId/images/:imageId/delete')
  @ApiOperation({ summary: '이미지 삭제' })
  async deleteImage(@Param('imageId', ParseIntPipe) imageId: number) {
    await this.productImagesService.delete(imageId);
    return { success: true, message: '이미지 삭제 성공', data: null, timestamp: new Date().toISOString() };
  }
}
