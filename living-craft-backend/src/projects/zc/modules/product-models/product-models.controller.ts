import { Controller, Get, Param, Post, Body, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ProductModelsService } from './product-models.service';
import { UpdatePriceDto } from './dto/request/update-price.dto';
import { CreateModelDto } from './dto/request/create-model.dto';
import { LinkProductDto } from './dto/request/link-product.dto';
import { SearchModelsDto } from './dto/request/search-models.dto';

@Controller('zc/product-models')
@ApiTags('제품 모델 (사용자 정의 마스터)')
export class ProductModelsController {
  constructor(private readonly productModelsService: ProductModelsService) {}

  @Get()
  @ApiOperation({ summary: '전체 제품 모델 목록 조회' })
  async getAllModels() {
    return await this.productModelsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: '제품 모델 상세 조회' })
  async getModelById(@Param('id') id: string) {
    return await this.productModelsService.findById(id);
  }

  @Get('brand/:brandId')
  @ApiOperation({ summary: '특정 브랜드의 제품 모델 목록 조회' })
  async getModelsByBrand(@Param('brandId') brandId: string) {
    return await this.productModelsService.findByBrandId(brandId);
  }

  @Post(':id/price')
  @ApiOperation({ summary: '제품 모델 가격 설정 (판매가/원가/마진율)' })
  @ApiResponse({ status: 200, description: '가격 설정 성공' })
  @ApiResponse({ status: 404, description: '제품 모델을 찾을 수 없음' })
  async updatePrice(@Param('id') id: string, @Body() dto: UpdatePriceDto) {
    return await this.productModelsService.updatePrice(id, dto);
  }

  @Post(':id/calculate-cost')
  @ApiOperation({ summary: '원가 자동 계산 (연결된 제품의 최저가 기준)' })
  @ApiResponse({ status: 200, description: '원가 계산 성공' })
  @ApiResponse({ status: 404, description: '제품 모델을 찾을 수 없음' })
  @ApiResponse({ status: 400, description: '연결된 제품이 없음' })
  async calculateCostPrice(@Param('id') id: string) {
    return await this.productModelsService.calculateAndUpdateCostPrice(id);
  }

  @Post()
  @ApiOperation({ summary: '제품 모델 생성' })
  @ApiResponse({ status: 201, description: '모델 생성 성공' })
  @ApiResponse({ status: 400, description: '중복된 모델명' })
  async createModel(@Body() dto: CreateModelDto) {
    return await this.productModelsService.createModel(dto);
  }

  @Post('search')
  @ApiOperation({ summary: '제품 모델 검색 (필터링/페이지네이션)' })
  @ApiResponse({ status: 200, description: '검색 성공' })
  async searchModels(@Body() dto: SearchModelsDto) {
    return await this.productModelsService.searchModels(dto);
  }

  @Post(':id/link')
  @ApiOperation({ summary: '제품을 모델에 연결 (연결 후 원가 자동 재계산)' })
  @ApiResponse({ status: 201, description: '연결 성공' })
  @ApiResponse({ status: 404, description: '모델 또는 제품을 찾을 수 없음' })
  @ApiResponse({ status: 400, description: '이미 연결된 제품' })
  async linkProduct(@Param('id') id: string, @Body() dto: LinkProductDto) {
    const link = await this.productModelsService.linkProduct(id, dto);

    // 제품 연결 후 원가 자동 재계산
    try {
      await this.productModelsService.calculateAndUpdateCostPrice(id);
    } catch (error) {
      // 원가 계산 실패는 무시 (연결은 성공)
    }

    return link;
  }

  @Post(':id/unlink/:listingId')
  @ApiOperation({ summary: '제품 연결 해제 (해제 후 원가 자동 재계산)' })
  @ApiResponse({ status: 200, description: '연결 해제 성공' })
  @ApiResponse({ status: 404, description: '연결을 찾을 수 없음' })
  async unlinkProduct(@Param('id') id: string, @Param('listingId') listingId: string) {
    await this.productModelsService.unlinkProduct(id, listingId);

    // 제품 연결 해제 후 원가 자동 재계산
    try {
      await this.productModelsService.calculateAndUpdateCostPrice(id);
    } catch (error) {
      // 원가 계산 실패는 무시 (남은 제품이 없을 수 있음)
    }

    return { message: '연결이 해제되었습니다.' };
  }

  @Get(':id/products')
  @ApiOperation({ summary: '모델에 연결된 제품 목록 조회' })
  @ApiResponse({ status: 200, description: '조회 성공' })
  async getLinkedProducts(@Param('id') id: string) {
    return await this.productModelsService.getLinkedProducts(id);
  }
}
