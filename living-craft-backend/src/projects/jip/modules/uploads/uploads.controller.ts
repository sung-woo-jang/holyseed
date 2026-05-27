import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FilesService } from '@shared/files/files.service';
import { Public } from '@common/decorators';
import { CatalogService } from '../catalog/catalog.service';
import { SiteAssetsService } from '../site-assets/site-assets.service';

@ApiTags('JIP 파일 업로드')
@Controller('jip/uploads')
export class UploadsController {
  constructor(
    private readonly filesService: FilesService,
    private readonly catalogService: CatalogService,
    private readonly siteAssetsService: SiteAssetsService,
  ) {}

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

  @Post('catalog-item-photo')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: '[관리자] 카탈로그 서비스 아이템 사진 등록' })
  async uploadCatalogItemPhoto(
    @UploadedFile() file: Express.Multer.File,
    @Body('itemCode') itemCode: string,
  ) {
    if (!itemCode) throw new BadRequestException('itemCode를 입력해주세요.');
    const data = await this.uploadPhoto(file, 'jip/catalog/items');
    await this.catalogService.updateItemImage(itemCode, data.url);
    return { success: true, message: '이미지가 등록됐어요', data: { url: data.url }, timestamp: new Date().toISOString() };
  }

  @Post('catalog-category-photo')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: '[관리자] 카탈로그 카테고리 사진 등록' })
  async uploadCatalogCategoryPhoto(
    @UploadedFile() file: Express.Multer.File,
    @Body('categoryCode') categoryCode: string,
  ) {
    if (!categoryCode) throw new BadRequestException('categoryCode를 입력해주세요.');
    const data = await this.uploadPhoto(file, 'jip/catalog/categories');
    await this.catalogService.updateCategoryImage(categoryCode, data.url);
    return { success: true, message: '이미지가 등록됐어요', data: { url: data.url }, timestamp: new Date().toISOString() };
  }

  @Post('site-asset')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: '[관리자] 사이트 에셋 사진 등록' })
  async uploadSiteAsset(
    @UploadedFile() file: Express.Multer.File,
    @Body('assetKey') assetKey: string,
    @Body('caption') caption?: string,
  ) {
    if (!assetKey) throw new BadRequestException('assetKey를 입력해주세요.');
    const data = await this.uploadPhoto(file, 'jip/site-assets');
    await this.siteAssetsService.upsert(assetKey, data.url, caption);
    return { success: true, message: '사이트 에셋이 등록됐어요', data: { url: data.url }, timestamp: new Date().toISOString() };
  }
}
