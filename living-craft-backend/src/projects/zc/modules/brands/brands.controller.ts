import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { BrandsService } from './brands.service';

@Controller('zc/brands')
@ApiTags('ZC 브랜드')
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Get()
  @ApiOperation({ summary: '브랜드 목록 조회 (제품 개수 포함)' })
  @ApiResponse({ status: 200, description: '브랜드 목록' })
  async getAllBrands() {
    return await this.brandsService.findAllWithProductCount();
  }

  @Get(':id')
  @ApiOperation({ summary: '브랜드 상세 조회' })
  @ApiParam({ name: 'id', description: '브랜드 ID (UUID)' })
  @ApiResponse({ status: 200, description: '브랜드 상세' })
  @ApiResponse({ status: 404, description: '브랜드를 찾을 수 없음' })
  async getBrandById(@Param('id') id: string) {
    return await this.brandsService.findById(id);
  }
}
