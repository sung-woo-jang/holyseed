import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Public } from '@common/decorators';
import { CasesService } from './cases.service';

@ApiTags('JIP 시공사례')
@Controller('jip/cases')
@Public()
export class CasesController {
  constructor(private readonly casesService: CasesService) {}

  @Get()
  @ApiOperation({ summary: '시공사례 목록' })
  @ApiQuery({ name: 'tag', required: false })
  async findAll(@Query('tag') tag?: string) {
    const data = await this.casesService.findAll(tag);
    return { success: true, message: '시공사례 목록 조회 성공', data, timestamp: new Date().toISOString() };
  }

  @Get('recent')
  @ApiOperation({ summary: '최근 시공사례 (홈페이지용)' })
  async findRecent() {
    const data = await this.casesService.findRecent(3);
    return { success: true, message: '최근 시공사례 조회 성공', data, timestamp: new Date().toISOString() };
  }

  @Get(':id')
  @ApiOperation({ summary: '시공사례 상세' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const data = await this.casesService.findOne(id);
    return { success: true, message: '시공사례 상세 조회 성공', data, timestamp: new Date().toISOString() };
  }
}
