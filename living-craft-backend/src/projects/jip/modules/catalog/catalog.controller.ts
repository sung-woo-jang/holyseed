import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Public } from '@common/decorators';
import { CatalogService } from './catalog.service';
import { CreateCategoryDto, ToggleActiveDto, UpdateCategoryDto } from './dto/admin-category.dto';
import { AdminItemListDto, CreateItemDto, ToggleFeaturedDto, UpdateItemDto } from './dto/admin-item.dto';

@ApiTags('JIP 카탈로그')
@Controller('jip/catalog')
@Public()
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('categories')
  @ApiOperation({ summary: '카테고리 목록' })
  async getCategories() {
    const data = await this.catalogService.getCategories();
    return { success: true, message: '카테고리 조회 성공', data, timestamp: new Date().toISOString() };
  }

  @Get('items')
  @ApiOperation({ summary: '서비스 아이템 목록' })
  @ApiQuery({ name: 'cat', required: false })
  async getItems(@Query('cat') cat?: string) {
    const data = await this.catalogService.getServiceItems(cat);
    return { success: true, message: '서비스 목록 조회 성공', data, timestamp: new Date().toISOString() };
  }

  @Get('items/featured')
  @ApiOperation({ summary: '인기 서비스 아이템' })
  async getFeatured() {
    const data = await this.catalogService.getFeaturedItems();
    return { success: true, message: '인기 아이템 조회 성공', data, timestamp: new Date().toISOString() };
  }

  @Get('items/:code')
  @ApiOperation({ summary: '서비스 아이템 상세 (PC 제품 포함)' })
  async getItem(@Param('code') code: string) {
    const data = await this.catalogService.getServiceItemByCode(code);
    return { success: true, message: '서비스 상세 조회 성공', data, timestamp: new Date().toISOString() };
  }

  @Get('products/:code')
  @ApiOperation({ summary: '제품 상세 (PC 제품)' })
  async getProduct(@Param('code') code: string) {
    const data = await this.catalogService.getProductByCode(code);
    return { success: true, message: '제품 조회 성공', data, timestamp: new Date().toISOString() };
  }

  // ──────────────── Admin Category ────────────────

  @Post('admin/categories/list')
  @ApiOperation({ summary: '[관리자] 카테고리 전체 목록' })
  async adminCategoryList() {
    const data = await this.catalogService.adminListCategories();
    return { success: true, message: '카테고리 목록 조회 성공', data, timestamp: new Date().toISOString() };
  }

  @Get('admin/categories/:code')
  @ApiOperation({ summary: '[관리자] 카테고리 단건' })
  async adminGetCategory(@Param('code') code: string) {
    const data = await this.catalogService.adminGetCategory(code);
    return { success: true, message: '카테고리 조회 성공', data, timestamp: new Date().toISOString() };
  }

  @Post('admin/categories')
  @ApiOperation({ summary: '[관리자] 카테고리 생성' })
  async createCategory(@Body() dto: CreateCategoryDto) {
    const data = await this.catalogService.createCategory(dto);
    return { success: true, message: '카테고리가 생성됐어요', data, timestamp: new Date().toISOString() };
  }

  @Post('admin/categories/:code/update')
  @ApiOperation({ summary: '[관리자] 카테고리 수정' })
  async updateCategory(@Param('code') code: string, @Body() dto: UpdateCategoryDto) {
    const data = await this.catalogService.updateCategory(code, dto);
    return { success: true, message: '카테고리가 수정됐어요', data, timestamp: new Date().toISOString() };
  }

  @Post('admin/categories/:code/toggle')
  @ApiOperation({ summary: '[관리자] 카테고리 활성/비활성 토글' })
  async toggleCategory(@Param('code') code: string, @Body() dto: ToggleActiveDto) {
    const data = await this.catalogService.toggleCategoryActive(code, dto.isActive);
    return { success: true, message: `카테고리가 ${dto.isActive ? '활성화' : '비활성화'}됐어요`, data, timestamp: new Date().toISOString() };
  }

  @Post('admin/categories/:code/delete')
  @ApiOperation({ summary: '[관리자] 카테고리 비활성화' })
  async deleteCategory(@Param('code') code: string) {
    await this.catalogService.softDeleteCategory(code);
    return { success: true, message: '카테고리가 비활성화됐어요', data: null, timestamp: new Date().toISOString() };
  }

  // ──────────────── Admin ServiceItem ────────────────

  @Post('admin/items/list')
  @ApiOperation({ summary: '[관리자] 서비스 아이템 목록' })
  async adminItemList(@Body() dto: AdminItemListDto) {
    const data = await this.catalogService.adminListItems(dto);
    return { success: true, message: '서비스 아이템 목록 조회 성공', data, timestamp: new Date().toISOString() };
  }

  @Get('admin/items/:code')
  @ApiOperation({ summary: '[관리자] 서비스 아이템 단건 (연결된 PC 제품 포함)' })
  async adminGetItem(@Param('code') code: string) {
    const data = await this.catalogService.adminGetItem(code);
    return { success: true, message: '서비스 아이템 조회 성공', data, timestamp: new Date().toISOString() };
  }

  @Post('admin/items')
  @ApiOperation({ summary: '[관리자] 서비스 아이템 생성' })
  async createItem(@Body() dto: CreateItemDto) {
    const data = await this.catalogService.createItem(dto);
    return { success: true, message: '서비스 아이템이 생성됐어요', data, timestamp: new Date().toISOString() };
  }

  @Post('admin/items/:code/update')
  @ApiOperation({ summary: '[관리자] 서비스 아이템 수정' })
  async updateItem(@Param('code') code: string, @Body() dto: UpdateItemDto) {
    const data = await this.catalogService.updateItem(code, dto);
    return { success: true, message: '서비스 아이템이 수정됐어요', data, timestamp: new Date().toISOString() };
  }

  @Post('admin/items/:code/toggle')
  @ApiOperation({ summary: '[관리자] 서비스 아이템 활성/비활성 토글' })
  async toggleItem(@Param('code') code: string, @Body() dto: ToggleActiveDto) {
    const data = await this.catalogService.toggleItemActive(code, dto.isActive);
    return { success: true, message: `서비스 아이템이 ${dto.isActive ? '활성화' : '비활성화'}됐어요`, data, timestamp: new Date().toISOString() };
  }

  @Post('admin/items/:code/toggle-featured')
  @ApiOperation({ summary: '[관리자] 서비스 아이템 인기 토글' })
  async toggleItemFeatured(@Param('code') code: string, @Body() dto: ToggleFeaturedDto) {
    const data = await this.catalogService.toggleItemFeatured(code, dto.isFeatured);
    return { success: true, message: '인기 상태가 변경됐어요', data, timestamp: new Date().toISOString() };
  }

  @Post('admin/items/:code/delete')
  @ApiOperation({ summary: '[관리자] 서비스 아이템 비활성화' })
  async deleteItem(@Param('code') code: string) {
    await this.catalogService.softDeleteItem(code);
    return { success: true, message: '서비스 아이템이 비활성화됐어요', data: null, timestamp: new Date().toISOString() };
  }

  // ──────────────── Admin PC Product (catalog view) ────────────────

  @Post('admin/products/list')
  @ApiOperation({ summary: '[관리자] 제품 목록 (ServiceItem 연결된 PC 제품)' })
  async adminProductList(@Body() dto: { itemCode?: string; search?: string }) {
    const data = await this.catalogService.adminListProducts(dto);
    return { success: true, message: '제품 목록 조회 성공', data, timestamp: new Date().toISOString() };
  }

  @Get('admin/products/:code')
  @ApiOperation({ summary: '[관리자] 제품 단건 (PC 제품)' })
  async adminGetProduct(@Param('code') code: string) {
    const data = await this.catalogService.adminGetProduct(code);
    return { success: true, message: '제품 조회 성공', data, timestamp: new Date().toISOString() };
  }
}
