import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ProductListingsService } from './product-listings.service';
import { ProductQueryDto, ProductListResponseDto, ProductResponseDto } from './dto';

@Controller('zc/product-listings')
@ApiTags('ZC 제품 리스팅')
export class ProductListingsController {
  constructor(private readonly productListingsService: ProductListingsService) {}

  @Post('search')
  @ApiOperation({ summary: '제품 검색/필터링 (페이지네이션)' })
  @ApiResponse({ status: 200, description: '제품 목록', type: ProductListResponseDto })
  async searchProducts(@Body() query: ProductQueryDto): Promise<ProductListResponseDto> {
    return await this.productListingsService.searchWithFilters(query);
  }

  @Post('unmatched')
  @ApiOperation({ summary: '미매칭 제품 목록 조회 (ProductModel에 연결되지 않은 제품)' })
  @ApiResponse({ status: 200, description: '미매칭 제품 목록', type: ProductListResponseDto })
  async getUnmatchedProducts(@Body() query: ProductQueryDto): Promise<ProductListResponseDto> {
    return await this.productListingsService.findUnmatched(query);
  }

  @Get()
  @ApiOperation({ summary: 'Dasis 제품 전체 목록 조회 (필터 없음)' })
  @ApiResponse({ status: 200, description: '제품 목록', type: ProductListResponseDto })
  async getProducts(@Query() query: ProductQueryDto): Promise<ProductListResponseDto> {
    const siteId = await this.productListingsService.getSiteIdByCode('dasis');
    return await this.productListingsService.findAllWithPagination(siteId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: '제품 상세 조회' })
  @ApiParam({ name: 'id', description: '제품 ID (UUID)' })
  @ApiResponse({ status: 200, description: '제품 상세', type: ProductResponseDto })
  @ApiResponse({ status: 404, description: '제품을 찾을 수 없음' })
  async getProductById(@Param('id') id: string) {
    return await this.productListingsService.findOne(id);
  }
}
