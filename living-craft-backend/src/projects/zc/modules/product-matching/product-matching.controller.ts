import { Public } from '@common/decorators';
import { Controller, Get, Post, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ProductMatchingService } from './product-matching.service';

@Public()
@Controller('zc/product-matching')
@ApiTags('ZC 제품 자동 매칭')
export class ProductMatchingController {
  constructor(private readonly productMatchingService: ProductMatchingService) {}

  @Get('unmatched')
  @ApiOperation({ summary: '미매칭 제품 목록 조회' })
  @ApiResponse({ status: 200, description: '미매칭 제품 목록' })
  async getUnmatchedListings() {
    const listings = await this.productMatchingService.findUnmatchedListings();
    return {
      success: true,
      data: listings,
      message: `미매칭 제품 ${listings.length}개 조회 완료`,
    };
  }

  @Post(':listingId/auto-match')
  @ApiOperation({ summary: '특정 제품 자동 매칭 실행' })
  @ApiResponse({ status: 200, description: '매칭 성공' })
  @ApiResponse({ status: 200, description: '매칭 실패 (신뢰도 부족 또는 모델 없음)' })
  async autoMatchListing(@Param('listingId') listingId: string) {
    const result = await this.productMatchingService.autoMatch(listingId);

    if (result) {
      return {
        success: true,
        data: result,
        message: `자동 매칭 성공 (신뢰도: ${(result.matchConfidence * 100).toFixed(1)}%)`,
      };
    } else {
      return {
        success: false,
        data: null,
        message: '자동 매칭 실패 (신뢰도 부족 또는 적합한 모델 없음)',
      };
    }
  }

  @Post('auto-match-all')
  @ApiOperation({ summary: '모든 미매칭 제품 일괄 자동 매칭' })
  @ApiResponse({ status: 200, description: '일괄 매칭 완료' })
  async autoMatchAll() {
    const result = await this.productMatchingService.autoMatchAll();
    return {
      success: true,
      data: result,
      message: `일괄 매칭 완료: 성공 ${result.matched}개, 실패 ${result.failed}개`,
    };
  }

  @Get(':listingId/suggestions')
  @ApiOperation({ summary: '매칭 후보 추천' })
  @ApiQuery({ name: 'limit', required: false, description: '추천 개수', example: 5 })
  @ApiResponse({ status: 200, description: '매칭 후보 목록' })
  async getSuggestions(@Param('listingId') listingId: string, @Query('limit') limit?: number) {
    const suggestions = await this.productMatchingService.suggestMatches(
      listingId,
      limit ? parseInt(limit.toString(), 10) : 5,
    );

    return {
      success: true,
      data: suggestions,
      message: `매칭 후보 ${suggestions.length}개 조회 완료`,
    };
  }
}
