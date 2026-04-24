import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { SiteCategoriesService } from './site-categories.service';
import { CategoryResponseDto, CategoryTreeResponseDto } from './dto';

@Controller('zc/categories')
@ApiTags('ZC 카테고리')
export class SiteCategoriesController {
  constructor(private readonly siteCategoriesService: SiteCategoriesService) {}

  @Get()
  @ApiOperation({ summary: '카테고리 전체 목록 조회' })
  @ApiQuery({ name: 'siteCode', required: false, description: '사이트 코드 (기본값: dasis)' })
  @ApiResponse({ status: 200, description: '카테고리 목록', type: [CategoryResponseDto] })
  async getAllCategories(@Query('siteCode') siteCode?: string) {
    const code = siteCode || 'dasis';
    const siteId = await this.siteCategoriesService.getSiteIdByCode(code);
    return await this.siteCategoriesService.findBySiteId(siteId);
  }

  @Get('tree')
  @ApiOperation({ summary: '카테고리 트리 구조 조회' })
  @ApiQuery({ name: 'siteCode', required: false, description: '사이트 코드 (기본값: dasis)' })
  @ApiResponse({ status: 200, description: '카테고리 트리', type: [CategoryTreeResponseDto] })
  async getCategoryTree(@Query('siteCode') siteCode?: string) {
    const code = siteCode || 'dasis';
    const siteId = await this.siteCategoriesService.getSiteIdByCode(code);
    return await this.siteCategoriesService.findTreeBySiteId(siteId);
  }

  @Get(':id')
  @ApiOperation({ summary: '카테고리 상세 조회' })
  @ApiParam({ name: 'id', description: '카테고리 ID (UUID)' })
  @ApiResponse({ status: 200, description: '카테고리 상세', type: CategoryResponseDto })
  @ApiResponse({ status: 404, description: '카테고리를 찾을 수 없음' })
  async getCategoryById(@Param('id') id: string) {
    return await this.siteCategoriesService.findOne(id);
  }

  @Get(':id/children')
  @ApiOperation({ summary: '하위 카테고리 조회' })
  @ApiParam({ name: 'id', description: '부모 카테고리 ID (UUID)' })
  @ApiResponse({ status: 200, description: '하위 카테고리 목록', type: [CategoryResponseDto] })
  async getChildCategories(@Param('id') id: string) {
    return await this.siteCategoriesService.findChildren(id);
  }
}
