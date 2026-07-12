import { Body, Controller, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CashflowService } from './cashflow.service';
import { MembershipGuard } from '../../common/guards/membership.guard';
import { CashflowQueryDto } from './dto/request/cashflow-query.dto';

@ApiTags('AD 현금흐름')
@Controller('ad')
export class CashflowController {
  constructor(private readonly cashflowService: CashflowService) {}

  @Post('households/:householdId/cashflow')
  @UseGuards(MembershipGuard)
  @ApiOperation({ summary: '월별 현금흐름 (수입/지출/순수입/저축률)' })
  async getCashflow(@Param('householdId', ParseIntPipe) householdId: number, @Body() dto: CashflowQueryDto) {
    const data = await this.cashflowService.getCashflow(householdId, dto);
    return { success: true, message: '조회 성공', data, timestamp: new Date().toISOString() };
  }
}
