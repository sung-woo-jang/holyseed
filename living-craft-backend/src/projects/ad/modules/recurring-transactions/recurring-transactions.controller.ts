import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RecurringTransactionsService } from './recurring-transactions.service';
import { MembershipGuard } from '../../common/guards/membership.guard';
import { RequireMembership } from '../../common/decorators/require-membership.decorator';
import { MemberRole } from '../memberships/entities/membership.entity';
import { CreateRecurringDto } from './dto/request/create-recurring.dto';

@ApiTags('AD 정기거래')
@Controller('ad')
export class RecurringTransactionsController {
  constructor(private readonly recurringService: RecurringTransactionsService) {}

  @Get('households/:householdId/recurring')
  @UseGuards(MembershipGuard)
  @ApiOperation({ summary: '정기거래 목록 조회' })
  async findAll(@Param('householdId', ParseIntPipe) householdId: number) {
    const data = await this.recurringService.findByHousehold(householdId);
    return { success: true, message: '조회 성공', data, timestamp: new Date().toISOString() };
  }

  @Post('households/:householdId/recurring')
  @UseGuards(MembershipGuard)
  @RequireMembership({ minRole: MemberRole.EDITOR })
  @ApiOperation({ summary: '정기거래 생성' })
  async create(@Param('householdId', ParseIntPipe) householdId: number, @Body() dto: CreateRecurringDto) {
    const data = await this.recurringService.create(householdId, dto);
    return { success: true, message: '정기거래 생성 성공', data, timestamp: new Date().toISOString() };
  }

  @Post('recurring/:id/update')
  @ApiOperation({ summary: '정기거래 수정' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: Partial<CreateRecurringDto>) {
    const data = await this.recurringService.update(id, dto);
    return { success: true, message: '수정 성공', data, timestamp: new Date().toISOString() };
  }

  @Post('recurring/:id/toggle')
  @ApiOperation({ summary: '정기거래 활성/비활성 전환' })
  async toggle(@Param('id', ParseIntPipe) id: number) {
    const data = await this.recurringService.toggle(id);
    return { success: true, message: '상태 변경 성공', data, timestamp: new Date().toISOString() };
  }

  @Post('recurring/:id/delete')
  @ApiOperation({ summary: '정기거래 삭제' })
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.recurringService.delete(id);
    return { success: true, message: '삭제 성공', data: null, timestamp: new Date().toISOString() };
  }

  @Post('recurring/:id/run-now')
  @ApiOperation({ summary: '정기거래 즉시 실행' })
  async runNow(@Param('id', ParseIntPipe) id: number) {
    const data = await this.recurringService.runNow(id);
    return { success: true, message: '즉시 실행 성공', data, timestamp: new Date().toISOString() };
  }
}
