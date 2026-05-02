import { Public } from '@common/decorators';
import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SitesService } from './sites.service';

@Public()
@Controller('zc/sites')
@ApiTags('사이트 관리')
export class SitesController {
  constructor(private readonly sitesService: SitesService) {}

  @Get()
  @ApiOperation({ summary: '크롤링 사이트 목록 조회' })
  async getAllSites() {
    return await this.sitesService.findAll();
  }
}
