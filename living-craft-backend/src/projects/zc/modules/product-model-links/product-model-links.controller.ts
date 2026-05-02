import { Public } from '@common/decorators';
import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ProductModelLinksService } from './product-model-links.service';

@Public()
@Controller('zc/product-model-links')
@ApiTags('제품 모델 매칭 (수동 연결)')
export class ProductModelLinksController {
  constructor(private readonly productModelLinksService: ProductModelLinksService) {}

  @Get()
  @ApiOperation({ summary: '전체 매칭 목록 조회' })
  async getAllLinks() {
    return await this.productModelLinksService.findAll();
  }

  @Get('listing/:listingId')
  @ApiOperation({ summary: '리스팅의 매칭 조회' })
  async getLinkByListing(@Param('listingId') listingId: string) {
    return await this.productModelLinksService.findByListingId(listingId);
  }

  @Get('model/:modelId')
  @ApiOperation({ summary: '모델에 연결된 모든 리스팅 조회' })
  async getLinksByModel(@Param('modelId') modelId: string) {
    return await this.productModelLinksService.findByModelId(modelId);
  }

  @Post()
  @ApiOperation({ summary: '리스팅과 모델 매칭 생성' })
  async createLink(
    @Body() body: { listingId: string; modelId: string; linkedBy?: string },
  ) {
    return await this.productModelLinksService.create(
      body.listingId,
      body.modelId,
      body.linkedBy,
    );
  }

  @Post('search')
  @ApiOperation({ summary: '매칭 목록 검색 (페이지네이션, 검색어, matchType 필터)' })
  async searchLinks(
    @Body() body: { page?: number; limit?: number; search?: string; matchType?: string },
  ) {
    return await this.productModelLinksService.search(body);
  }

  @Post(':id/delete')
  @ApiOperation({ summary: '매칭 삭제' })
  async deleteLink(@Param('id') id: string) {
    await this.productModelLinksService.delete(id);
    return { success: true, message: '매칭이 삭제되었습니다.' };
  }
}
