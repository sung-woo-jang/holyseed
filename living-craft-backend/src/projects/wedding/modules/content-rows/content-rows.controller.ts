import { Body, Controller, Get, Param, Post, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '@common/decorators/public.decorator';
import { ContentRowsService } from './content-rows.service';
import { CreateContentRowDto } from './dto/request/create-content-row.dto';
import { UpdateContentRowDto } from './dto/request/update-content-row.dto';
import { SearchContentRowsDto } from './dto/request/search-content-rows.dto';

@ApiTags('Wedding 콘텐츠 행')
@Controller('wedding/content-rows')
export class ContentRowsController {
  constructor(private readonly contentRowsService: ContentRowsService) {}

  @Post('search')
  @Public()
  @ApiOperation({ summary: '콘텐츠 행 목록 (includeHidden=false면 공개)' })
  async search(@Body() dto: SearchContentRowsDto, @Request() req: any) {
    // includeHidden이 true인 경우만 user 전달 (인증 필요)
    const user = dto.includeHidden ? req.user : undefined;
    const data = await this.contentRowsService.search(dto, user);
    return {
      success: true,
      message: '콘텐츠 행 목록 조회 성공',
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: '콘텐츠 행 생성' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  async create(@Body() dto: CreateContentRowDto, @Request() req: any) {
    const data = await this.contentRowsService.create(dto, req.user);
    return {
      success: true,
      message: '콘텐츠 행이 생성되었습니다.',
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: '콘텐츠 행 상세 조회' })
  async findById(@Param('id') id: string, @Request() req: any) {
    const data = await this.contentRowsService.findById(id, req.user);
    return {
      success: true,
      message: '콘텐츠 행 조회 성공',
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Post(':id/update')
  @ApiBearerAuth()
  @ApiOperation({ summary: '콘텐츠 행 수정' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  async update(@Param('id') id: string, @Body() dto: UpdateContentRowDto, @Request() req: any) {
    const data = await this.contentRowsService.update(id, dto, req.user);
    return {
      success: true,
      message: '콘텐츠 행이 수정되었습니다.',
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Post(':id/delete')
  @ApiBearerAuth()
  @ApiOperation({ summary: '콘텐츠 행 삭제' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  async delete(@Param('id') id: string, @Request() req: any) {
    await this.contentRowsService.delete(id, req.user);
    return {
      success: true,
      message: '콘텐츠 행이 삭제되었습니다.',
      data: null,
      timestamp: new Date().toISOString(),
    };
  }
}
