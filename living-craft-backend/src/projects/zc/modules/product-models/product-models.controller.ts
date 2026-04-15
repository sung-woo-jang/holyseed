import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ProductModelsService } from './product-models.service';

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
}
