import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Public } from '@common/decorators';
import { CatalogService } from './catalog.service';

@ApiTags('JIP 카탈로그')
@Controller('jip/catalog')
@Public()
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get()
  @ApiOperation({ summary: '전체 카탈로그 트리 (카테고리 + 아이템 + 제품그룹 + 제품)' })
  async getFullCatalog() {
    const data = await this.catalogService.getFullCatalog();
    return { success: true, message: '카탈로그 조회 성공', data, timestamp: new Date().toISOString() };
  }

  @Get('categories')
  @ApiOperation({ summary: '카테고리 목록' })
  async getCategories() {
    const data = await this.catalogService.getCategories();
    return { success: true, message: '카테고리 조회 성공', data, timestamp: new Date().toISOString() };
  }

  @Get('items')
  @ApiOperation({ summary: '서비스 아이템 목록' })
  @ApiQuery({ name: 'cat', required: false, description: '카테고리 코드 (kitchen/bath/film/floor)' })
  async getItems(@Query('cat') cat?: string) {
    const data = await this.catalogService.getServiceItems(cat);
    return { success: true, message: '서비스 목록 조회 성공', data, timestamp: new Date().toISOString() };
  }

  @Get('items/featured')
  @ApiOperation({ summary: '인기 서비스 아이템 (featured)' })
  async getFeatured() {
    const data = await this.catalogService.getFeaturedItems();
    return { success: true, message: '인기 아이템 조회 성공', data, timestamp: new Date().toISOString() };
  }

  @Get('items/:code')
  @ApiOperation({ summary: '서비스 아이템 상세 (제품 그룹 포함)' })
  async getItem(@Param('code') code: string) {
    const data = await this.catalogService.getServiceItemByCode(code);
    return { success: true, message: '서비스 상세 조회 성공', data, timestamp: new Date().toISOString() };
  }

  @Get('products/:code')
  @ApiOperation({ summary: '제품 상세' })
  async getProduct(@Param('code') code: string) {
    const data = await this.catalogService.getProductByCode(code);
    return { success: true, message: '제품 조회 성공', data, timestamp: new Date().toISOString() };
  }
}
