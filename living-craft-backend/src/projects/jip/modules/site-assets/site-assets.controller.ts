import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '@common/decorators';
import { SiteAssetsService } from './site-assets.service';
import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class UpdateCaptionDto {
  @ApiProperty()
  @IsString()
  caption: string;
}

@ApiTags('JIP 사이트 에셋')
@Controller('jip/site-assets')
export class SiteAssetsController {
  constructor(private readonly siteAssetsService: SiteAssetsService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: '사이트 에셋 전체 조회 (key → asset 맵)' })
  async getAll() {
    const data = await this.siteAssetsService.getAll();
    return { success: true, message: '조회 성공', data, timestamp: new Date().toISOString() };
  }

  @Post('admin/:key/caption')
  @ApiOperation({ summary: '[관리자] 사이트 에셋 caption 단독 저장' })
  async updateCaption(@Param('key') key: string, @Body() dto: UpdateCaptionDto) {
    const data = await this.siteAssetsService.updateCaption(key, dto.caption);
    return { success: true, message: 'Caption이 업데이트됐어요', data, timestamp: new Date().toISOString() };
  }
}
