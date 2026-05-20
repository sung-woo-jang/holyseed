import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/request/create-product.dto';
import { UpdateProductDto } from './dto/request/update-product.dto';
import { SearchProductsDto } from './dto/request/search-products.dto';
import { CompareProductsDto } from './dto/request/compare-products.dto';
import { ImportProductsDto } from './dto/request/import-products.dto';

@ApiTags('PC 제품')
@Controller('pc/products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post('search')
  @ApiOperation({ summary: '제품 검색 (카테고리/모델코드/이름/브랜드)' })
  async search(@Body() dto: SearchProductsDto) {
    const data = await this.productsService.search(dto);
    return { success: true, message: '제품 검색 성공', data, timestamp: new Date().toISOString() };
  }

  @Post('compare')
  @ApiOperation({ summary: '카테고리별 업체 단가 비교 매트릭스' })
  async compare(@Body() dto: CompareProductsDto) {
    const data = await this.productsService.compare(dto);
    return { success: true, message: '비교 데이터 조회 성공', data, timestamp: new Date().toISOString() };
  }

  @Post('import')
  @ApiOperation({ summary: 'JSON 일괄 임포트' })
  async importBulk(@Body() dto: ImportProductsDto) {
    const data = await this.productsService.importBulk(dto);
    return { success: true, message: '임포트 완료', data, timestamp: new Date().toISOString() };
  }

  @Get(':id')
  @ApiOperation({ summary: '제품 상세 조회 (이미지/가격 포함)' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const data = await this.productsService.findOne(id);
    return { success: true, message: '제품 조회 성공', data, timestamp: new Date().toISOString() };
  }

  @Post()
  @ApiOperation({ summary: '제품 생성' })
  async create(@Body() dto: CreateProductDto) {
    const data = await this.productsService.create(dto);
    return { success: true, message: '제품 생성 성공', data, timestamp: new Date().toISOString() };
  }

  @Post(':id/update')
  @ApiOperation({ summary: '제품 수정' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProductDto) {
    const data = await this.productsService.update(id, dto);
    return { success: true, message: '제품 수정 성공', data, timestamp: new Date().toISOString() };
  }

  @Post(':id/delete')
  @ApiOperation({ summary: '제품 삭제 (가격/이미지 포함)' })
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.productsService.delete(id);
    return { success: true, message: '제품 삭제 성공', data: null, timestamp: new Date().toISOString() };
  }
}
