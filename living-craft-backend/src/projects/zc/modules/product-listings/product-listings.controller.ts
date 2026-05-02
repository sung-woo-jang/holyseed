import { Public } from '@common/decorators';
import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ProductListingsService } from './product-listings.service';
import { ProductQueryDto, ProductListResponseDto, ProductResponseDto } from './dto';
import { CreateManualListingDto } from './dto/request/create-manual-listing.dto';
import { UpdateManualListingDto } from './dto/request/update-manual-listing.dto';

@Public()
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

  @Post('manual')
  @ApiOperation({ summary: '수동 제품 listing 생성 (크롤링 없이 직접 입력)' })
  @ApiResponse({ status: 201, description: '생성 성공' })
  async createManualListing(@Body() dto: CreateManualListingDto) {
    const data = await this.productListingsService.createManualListing(dto);
    return { success: true, message: '수동 제품 생성 성공', data };
  }

  @Post('manual/:id/update')
  @ApiOperation({ summary: '수동 제품 listing 수정' })
  async updateManualListing(@Param('id') id: string, @Body() dto: UpdateManualListingDto) {
    const data = await this.productListingsService.updateManualListing(id, dto);
    return { success: true, message: '수동 제품 수정 성공', data };
  }

  @Post('manual/:id/delete')
  @ApiOperation({ summary: '수동 제품 listing 삭제' })
  async deleteManualListing(@Param('id') id: string) {
    await this.productListingsService.deleteManualListing(id);
    return { success: true, message: '수동 제품 삭제 성공', data: null };
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
