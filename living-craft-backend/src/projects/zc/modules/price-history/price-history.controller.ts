import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiParam, ApiResponse } from '@nestjs/swagger';
import { PriceHistoryService } from './price-history.service';
import { PriceHistoryQueryDto } from './dto/query/price-history-query.dto';

@Controller('zc/price-history')
@ApiTags('ZC 가격 이력')
export class PriceHistoryController {
  constructor(private readonly priceHistoryService: PriceHistoryService) {}

  @Get('products/:productId')
  @ApiOperation({ summary: '제품의 전체 가격 이력 조회 (필터 없음)' })
  @ApiParam({ name: 'productId', description: '제품 ID (UUID)' })
  @ApiQuery({ name: 'startDate', required: false, description: '시작 날짜 (ISO 8601)' })
  @ApiQuery({ name: 'endDate', required: false, description: '종료 날짜 (ISO 8601)' })
  @ApiResponse({ status: 200, description: '가격 이력 목록' })
  async getProductPriceHistory(
    @Param('productId') productId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    if (startDate && endDate) {
      return await this.priceHistoryService.findByListingIdAndDateRange(
        productId,
        new Date(startDate),
        new Date(endDate),
      );
    }

    return await this.priceHistoryService.findByListingId(productId);
  }

  @Post('products/:productId/search')
  @ApiOperation({ summary: '제품의 가격 이력 필터링 조회' })
  @ApiParam({ name: 'productId', description: '제품 ID (UUID)' })
  @ApiResponse({ status: 200, description: '가격 이력 목록' })
  async searchProductPriceHistory(
    @Param('productId') productId: string,
    @Body() query: PriceHistoryQueryDto,
  ) {
    if (query.startDate && query.endDate) {
      return await this.priceHistoryService.findByListingIdAndDateRange(
        productId,
        new Date(query.startDate),
        new Date(query.endDate),
      );
    }

    return await this.priceHistoryService.findByListingId(productId);
  }

  @Get('recent-changes')
  @ApiOperation({ summary: '최근 가격 변동 제품 조회' })
  @ApiQuery({ name: 'days', required: false, description: '최근 며칠 (기본: 7일)', example: 7 })
  @ApiQuery({ name: 'limit', required: false, description: '최대 개수 (기본: 20)', example: 20 })
  @ApiResponse({ status: 200, description: '최근 가격 변동 목록' })
  async getRecentPriceChanges(
    @Query('days') days: string = '7',
    @Query('limit') limit: string = '20',
  ) {
    return await this.priceHistoryService.findRecentChanges(
      parseInt(days, 10),
      parseInt(limit, 10),
    );
  }
}
