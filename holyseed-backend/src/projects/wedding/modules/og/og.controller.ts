import { Controller, Get, Param, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { Public } from '@common/decorators/public.decorator';
import { OgService } from './og.service';

@ApiTags('Wedding OG 메타태그')
@Controller('wedding/og')
export class OgController {
  constructor(private readonly ogService: OgService) {}

  @Get(':slug')
  @Public()
  @ApiOperation({ summary: '카카오톡 등 링크 공유 미리보기용 OG 메타태그 HTML (공개, 크롤러 전용)' })
  async og(@Param('slug') slug: string, @Res() res: Response) {
    const html = await this.ogService.renderOgHtml(slug);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  }
}
