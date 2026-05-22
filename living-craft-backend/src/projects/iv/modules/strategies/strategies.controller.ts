import { Body, Controller, Get, Param, Post } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { IsNumber, IsOptional } from 'class-validator'
import { Public } from '@common/decorators'
import { StrategiesService } from './strategies.service'
import { CreateStrategyDto } from './dto/request/create-strategy.dto'

class UpdateStrategyDto {
  @IsOptional() @IsNumber() principal?: number
  @IsOptional() @IsNumber() division?: number
}

const ok = (data: unknown, message = '성공') => ({
  success: true, message, data, timestamp: new Date().toISOString(),
})

@ApiTags('IV 전략')
@Controller('iv/strategies')
@Public()
export class StrategiesController {
  constructor(private readonly svc: StrategiesService) {}

  @Get()
  @ApiOperation({ summary: '전략 목록' })
  async findAll() {
    return ok(await this.svc.findAll())
  }

  @Post()
  @ApiOperation({ summary: '전략 생성' })
  async create(@Body() dto: CreateStrategyDto) {
    return ok(await this.svc.create(dto), '전략이 생성되었습니다.')
  }

  @Get(':id')
  @ApiOperation({ summary: '전략 단건 조회' })
  async findOne(@Param('id') id: string) {
    return ok(await this.svc.findOne(id))
  }

  @Get(':id/state')
  @ApiOperation({ summary: '전략 현재 상태' })
  async getState(@Param('id') id: string) {
    return ok(await this.svc.getState(id))
  }

  @Post(':id/update')
  @ApiOperation({ summary: '전략 수정' })
  async update(@Param('id') id: string, @Body() dto: UpdateStrategyDto) {
    return ok(await this.svc.update(id, dto), '전략이 수정되었습니다.')
  }

  @Post(':id/delete')
  @ApiOperation({ summary: '전략 삭제' })
  async delete(@Param('id') id: string) {
    await this.svc.delete(id)
    return ok(null, '전략이 삭제되었습니다.')
  }
}
