import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { QuotesService } from './quotes.service';
import { CreateQuoteDto } from './dto/request/create-quote.dto';
import { UpdateQuoteDto } from './dto/request/update-quote.dto';
import { CreateQuoteItemDto } from './dto/request/create-quote-item.dto';
import { QuoteQueryDto } from './dto/query/quote-query.dto';

@Controller('zc/quotes')
@ApiTags('ZC 견적서 관리')
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Get()
  @ApiOperation({ summary: '견적서 전체 목록 조회 (필터 없음)' })
  @ApiQuery({ name: 'page', required: false, description: '페이지 번호' })
  @ApiQuery({ name: 'limit', required: false, description: '페이지당 개수' })
  @ApiQuery({ name: 'status', required: false, description: '상태 필터' })
  @ApiQuery({ name: 'search', required: false, description: '검색어' })
  @ApiResponse({ status: 200, description: '견적서 목록' })
  async getAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    const result = await this.quotesService.findAll({ page, limit, status, search });
    return result;
  }

  @Post('search')
  @ApiOperation({ summary: '견적서 검색/필터링 (페이지네이션)' })
  @ApiResponse({ status: 200, description: '견적서 목록' })
  async searchQuotes(@Body() query: QuoteQueryDto) {
    const result = await this.quotesService.findAll(query);
    return result;
  }

  @Get(':id')
  @ApiOperation({ summary: '견적서 상세 조회' })
  @ApiParam({ name: 'id', description: '견적서 ID' })
  @ApiResponse({ status: 200, description: '견적서 상세 정보' })
  @ApiResponse({ status: 404, description: '견적서를 찾을 수 없음' })
  async getById(@Param('id') id: string) {
    const quote = await this.quotesService.findById(id);
    return {
      success: true,
      data: quote,
      message: '견적서 조회 완료',
    };
  }

  @Post()
  @ApiOperation({ summary: '견적서 생성' })
  @ApiResponse({ status: 201, description: '견적서 생성 성공' })
  async create(@Body() dto: CreateQuoteDto) {
    const quote = await this.quotesService.create(dto);
    return {
      success: true,
      data: quote,
      message: '견적서가 생성되었습니다.',
    };
  }

  @Post(':id/update')
  @ApiOperation({ summary: '견적서 수정' })
  @ApiParam({ name: 'id', description: '견적서 ID' })
  @ApiResponse({ status: 200, description: '견적서 수정 성공' })
  @ApiResponse({ status: 404, description: '견적서를 찾을 수 없음' })
  async update(@Param('id') id: string, @Body() dto: UpdateQuoteDto) {
    const quote = await this.quotesService.update(id, dto);
    return {
      success: true,
      data: quote,
      message: '견적서가 수정되었습니다.',
    };
  }

  @Post(':id/delete')
  @ApiOperation({ summary: '견적서 삭제' })
  @ApiParam({ name: 'id', description: '견적서 ID' })
  @ApiResponse({ status: 200, description: '견적서 삭제 성공' })
  @ApiResponse({ status: 404, description: '견적서를 찾을 수 없음' })
  async delete(@Param('id') id: string) {
    await this.quotesService.delete(id);
    return {
      success: true,
      data: null,
      message: '견적서가 삭제되었습니다.',
    };
  }

  @Post(':id/items')
  @ApiOperation({ summary: '견적 항목 추가' })
  @ApiParam({ name: 'id', description: '견적서 ID' })
  @ApiResponse({ status: 201, description: '항목 추가 성공' })
  @ApiResponse({ status: 404, description: '견적서를 찾을 수 없음' })
  async addItem(@Param('id') id: string, @Body() dto: CreateQuoteItemDto) {
    const item = await this.quotesService.addItem(id, dto);
    return {
      success: true,
      data: item,
      message: '견적 항목이 추가되었습니다.',
    };
  }

  @Post(':id/items/:itemId/update')
  @ApiOperation({ summary: '견적 항목 수정' })
  @ApiParam({ name: 'id', description: '견적서 ID' })
  @ApiParam({ name: 'itemId', description: '항목 ID' })
  @ApiResponse({ status: 200, description: '항목 수정 성공' })
  @ApiResponse({ status: 404, description: '항목을 찾을 수 없음' })
  async updateItem(@Param('id') id: string, @Param('itemId') itemId: string, @Body() dto: CreateQuoteItemDto) {
    const item = await this.quotesService.updateItem(id, itemId, dto);
    return {
      success: true,
      data: item,
      message: '견적 항목이 수정되었습니다.',
    };
  }

  @Post(':id/items/:itemId/delete')
  @ApiOperation({ summary: '견적 항목 삭제' })
  @ApiParam({ name: 'id', description: '견적서 ID' })
  @ApiParam({ name: 'itemId', description: '항목 ID' })
  @ApiResponse({ status: 200, description: '항목 삭제 성공' })
  @ApiResponse({ status: 404, description: '항목을 찾을 수 없음' })
  async deleteItem(@Param('id') id: string, @Param('itemId') itemId: string) {
    await this.quotesService.deleteItem(id, itemId);
    return {
      success: true,
      data: null,
      message: '견적 항목이 삭제되었습니다.',
    };
  }

  @Post(':id/send')
  @ApiOperation({ summary: '견적서 발송 (상태 변경: sent)' })
  @ApiParam({ name: 'id', description: '견적서 ID' })
  @ApiResponse({ status: 200, description: '견적서 발송 완료' })
  async send(@Param('id') id: string) {
    const quote = await this.quotesService.updateStatus(id, 'sent');
    return {
      success: true,
      data: quote,
      message: '견적서가 발송되었습니다.',
    };
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: '견적서 복제' })
  @ApiParam({ name: 'id', description: '견적서 ID' })
  @ApiResponse({ status: 201, description: '견적서 복제 성공' })
  async duplicate(@Param('id') id: string) {
    const quote = await this.quotesService.duplicate(id);
    return {
      success: true,
      data: quote,
      message: '견적서가 복제되었습니다.',
    };
  }
}
