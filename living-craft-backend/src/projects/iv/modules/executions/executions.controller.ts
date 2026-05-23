import { Body, Controller, Get, Param, Post } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { IsNumber } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { ExecutionsService } from './executions.service'
import { CreateExecutionsDto } from './dto/request/create-executions.dto'

class UpdateExecutionDto {
  @ApiProperty({ description: '체결가', example: 74.32 })
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  price: number

  @ApiProperty({ description: '체결 수량', example: 4 })
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  qty: number
}

const ok = (data: unknown, message = '성공') => ({
  success: true, message, data, timestamp: new Date().toISOString(),
})

@ApiTags('IV 체결')
@Controller('iv/strategies')
export class ExecutionsController {
  constructor(private readonly svc: ExecutionsService) {}

  @Get(':id/executions')
  @ApiOperation({ summary: '체결 내역 목록' })
  async findAll(@Param('id') id: string) {
    return ok(await this.svc.findAll(id))
  }

  @Post(':id/executions')
  @ApiOperation({ summary: '체결 입력 + 상태 갱신' })
  async create(@Param('id') id: string, @Body() dto: CreateExecutionsDto) {
    return ok(await this.svc.create(id, dto), '체결이 저장되었습니다.')
  }

  @Post(':id/executions/:execId/delete')
  @ApiOperation({ summary: '체결 삭제 + 상태 재계산' })
  async deleteOne(@Param('id') id: string, @Param('execId') execId: string) {
    await this.svc.deleteOne(id, execId)
    return ok(null, '체결이 삭제되었습니다.')
  }

  @Post(':id/executions/:execId/update')
  @ApiOperation({ summary: '체결 수정 + 상태 재계산' })
  async updateOne(
    @Param('id') id: string,
    @Param('execId') execId: string,
    @Body() dto: UpdateExecutionDto,
  ) {
    await this.svc.updateOne(id, execId, { price: dto.price, qty: dto.qty })
    return ok(null, '체결이 수정되었습니다.')
  }
}
