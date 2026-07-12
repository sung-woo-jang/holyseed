import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { MembershipGuard } from '../../common/guards/membership.guard';
import { RequireMembership } from '../../common/decorators/require-membership.decorator';
import { MemberRole } from '../memberships/entities/membership.entity';
import { CreateTransactionDto } from './dto/request/create-transaction.dto';
import { SearchTransactionsDto } from './dto/request/search-transactions.dto';

@ApiTags('AD 거래')
@Controller('ad')
export class TransactionsController {
  constructor(private readonly txService: TransactionsService) {}

  @Get('households/:householdId/transactions/recent')
  @UseGuards(MembershipGuard)
  @ApiOperation({ summary: '최근 거래 조회' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findRecent(@Param('householdId', ParseIntPipe) householdId: number, @Query('limit') limit?: number) {
    const data = await this.txService.findRecent(householdId, limit ? Number(limit) : 10);
    return { success: true, message: '조회 성공', data, timestamp: new Date().toISOString() };
  }

  @Post('households/:householdId/transactions/search')
  @UseGuards(MembershipGuard)
  @ApiOperation({ summary: '거래 검색' })
  async search(@Param('householdId', ParseIntPipe) householdId: number, @Body() dto: SearchTransactionsDto) {
    const result = await this.txService.search(householdId, dto);
    return { success: true, message: '조회 성공', data: result.data, total: result.total, timestamp: new Date().toISOString() };
  }

  @Post('households/:householdId/transactions')
  @UseGuards(MembershipGuard)
  @RequireMembership({ minRole: MemberRole.EDITOR })
  @ApiOperation({ summary: '거래 생성' })
  async create(@Param('householdId', ParseIntPipe) householdId: number, @Body() dto: CreateTransactionDto, @Request() req: any) {
    const data = await this.txService.create(householdId, dto, req.user?.userId);
    return { success: true, message: '거래 생성 성공', data, timestamp: new Date().toISOString() };
  }

  @Get('transactions/:id')
  @ApiOperation({ summary: '거래 상세 조회' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const data = await this.txService.findOne(id);
    return { success: true, message: '조회 성공', data, timestamp: new Date().toISOString() };
  }

  @Post('transactions/:id/update')
  @ApiOperation({ summary: '거래 수정' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: Partial<CreateTransactionDto>) {
    const data = await this.txService.update(id, dto);
    return { success: true, message: '수정 성공', data, timestamp: new Date().toISOString() };
  }

  @Post('transactions/:id/delete')
  @ApiOperation({ summary: '거래 삭제' })
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.txService.delete(id);
    return { success: true, message: '삭제 성공', data: null, timestamp: new Date().toISOString() };
  }
}
