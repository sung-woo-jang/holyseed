import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ExpenseService } from './expense.service';
import { CreateExpenseDto, UpdateExpenseDto, SearchExpenseDto } from './dto/request';

const ok = (message: string, data: unknown) => ({
  success: true,
  message,
  data,
  timestamp: new Date().toISOString(),
});

@ApiTags('Lab 지출내역')
@Controller('lab/expense')
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService) {}

  @Get()
  @ApiOperation({ summary: '수입/지출 전체 조회' })
  async findAll() {
    return ok('조회 성공', await this.expenseService.findAll());
  }

  @Post('search')
  @ApiOperation({ summary: '월별 조회 + 집계 (총수입/총지출/순현금흐름/고정지출/분류별)' })
  async search(@Body() dto: SearchExpenseDto) {
    return ok('조회 성공', await this.expenseService.search(dto));
  }

  @Post()
  @ApiOperation({ summary: '수입/지출 기록 추가' })
  async create(@Body() dto: CreateExpenseDto) {
    return ok('기록이 추가되었습니다.', await this.expenseService.create(dto));
  }

  @Post(':id/update')
  @ApiOperation({ summary: '수입/지출 기록 수정' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateExpenseDto) {
    return ok('기록이 수정되었습니다.', await this.expenseService.update(id, dto));
  }

  @Post(':id/delete')
  @ApiOperation({ summary: '수입/지출 기록 삭제' })
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.expenseService.delete(id);
    return ok('기록이 삭제되었습니다.', null);
  }
}
