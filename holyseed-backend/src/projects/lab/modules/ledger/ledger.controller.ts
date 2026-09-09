import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { LedgerService } from './ledger.service';
import {
  CreateAssetDto,
  CreateCategoryDto,
  CreateTransactionDto,
  SearchTransactionDto,
  UpdateAssetDto,
  UpdateCategoryDto,
  UpdateTransactionDto,
} from './dto/request';

const ok = (message: string, data: unknown) => ({
  success: true,
  message,
  data,
  timestamp: new Date().toISOString(),
});

@ApiTags('Lab 거래장부')
@Controller('lab/ledger')
export class LedgerController {
  constructor(private readonly ledgerService: LedgerService) {}

  // ─── Categories ───────────────────────────────────────────────────────────

  @Get('categories')
  @ApiOperation({ summary: '카테고리 전체 조회' })
  async getCategories() {
    return ok('조회 성공', await this.ledgerService.getCategories());
  }

  @Post('categories')
  @ApiOperation({ summary: '카테고리 추가' })
  async createCategory(@Body() dto: CreateCategoryDto) {
    return ok('카테고리가 추가되었습니다.', await this.ledgerService.createCategory(dto));
  }

  @Post('categories/:id/update')
  @ApiOperation({ summary: '카테고리 수정' })
  async updateCategory(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCategoryDto) {
    return ok('카테고리가 수정되었습니다.', await this.ledgerService.updateCategory(id, dto));
  }

  @Post('categories/:id/delete')
  @ApiOperation({ summary: '카테고리 삭제' })
  async deleteCategory(@Param('id', ParseIntPipe) id: number) {
    await this.ledgerService.deleteCategory(id);
    return ok('카테고리가 삭제되었습니다.', null);
  }

  // ─── Assets ───────────────────────────────────────────────────────────────

  @Get('assets')
  @ApiOperation({ summary: '자산 전체 조회' })
  async getAssets() {
    return ok('조회 성공', await this.ledgerService.getAssets());
  }

  @Post('assets')
  @ApiOperation({ summary: '자산 추가' })
  async createAsset(@Body() dto: CreateAssetDto) {
    return ok('자산이 추가되었습니다.', await this.ledgerService.createAsset(dto));
  }

  @Post('assets/:id/update')
  @ApiOperation({ summary: '자산 수정' })
  async updateAsset(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateAssetDto) {
    return ok('자산이 수정되었습니다.', await this.ledgerService.updateAsset(id, dto));
  }

  @Post('assets/:id/delete')
  @ApiOperation({ summary: '자산 삭제' })
  async deleteAsset(@Param('id', ParseIntPipe) id: number) {
    await this.ledgerService.deleteAsset(id);
    return ok('자산이 삭제되었습니다.', null);
  }

  // ─── Transactions ─────────────────────────────────────────────────────────

  @Get('transactions')
  @ApiOperation({ summary: '거래 전체 조회' })
  async findAllTransactions() {
    return ok('조회 성공', await this.ledgerService.findAllTransactions());
  }

  @Post('transactions/search')
  @ApiOperation({ summary: '월별 거래 조회 + 집계 (수입/지출/저축률/카테고리별)' })
  async search(@Body() dto: SearchTransactionDto) {
    return ok('조회 성공', await this.ledgerService.search(dto));
  }

  @Post('transactions')
  @ApiOperation({ summary: '거래 등록' })
  async createTransaction(@Body() dto: CreateTransactionDto) {
    return ok('거래가 등록되었습니다.', await this.ledgerService.createTransaction(dto));
  }

  @Post('transactions/:id/update')
  @ApiOperation({ summary: '거래 수정' })
  async updateTransaction(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTransactionDto) {
    return ok('거래가 수정되었습니다.', await this.ledgerService.updateTransaction(id, dto));
  }

  @Post('transactions/:id/delete')
  @ApiOperation({ summary: '거래 삭제' })
  async deleteTransaction(@Param('id', ParseIntPipe) id: number) {
    await this.ledgerService.deleteTransaction(id);
    return ok('거래가 삭제되었습니다.', null);
  }
}
