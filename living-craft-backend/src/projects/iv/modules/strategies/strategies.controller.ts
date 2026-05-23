import { Body, Controller, Get, Param, Post } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { IsNumber, IsOptional } from 'class-validator'
import { CurrentUser } from '@common/decorators'
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
export class StrategiesController {
  constructor(private readonly svc: StrategiesService) {}

  @Get()
  @ApiOperation({ summary: '전략 목록' })
  async findAll(@CurrentUser() user: { userId: string }) {
    return ok(await this.svc.findAll(user.userId))
  }

  @Get('portfolio')
  @ApiOperation({ summary: '포트폴리오 요약' })
  async portfolio(@CurrentUser() user: { userId: string }) {
    return ok(await this.svc.getPortfolioSummary(user.userId))
  }

  @Post()
  @ApiOperation({ summary: '전략 생성' })
  async create(@CurrentUser() user: { userId: string }, @Body() dto: CreateStrategyDto) {
    return ok(await this.svc.create(user.userId, dto), '전략이 생성되었습니다.')
  }

  @Get(':id')
  @ApiOperation({ summary: '전략 단건 조회' })
  async findOne(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return ok(await this.svc.findOne(id, user.userId))
  }

  @Get(':id/state')
  @ApiOperation({ summary: '전략 현재 상태' })
  async getState(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return ok(await this.svc.getState(id, user.userId))
  }

  @Post(':id/update')
  @ApiOperation({ summary: '전략 수정' })
  async update(@CurrentUser() user: { userId: string }, @Param('id') id: string, @Body() dto: UpdateStrategyDto) {
    return ok(await this.svc.update(id, user.userId, dto), '전략이 수정되었습니다.')
  }

  @Post(':id/delete')
  @ApiOperation({ summary: '전략 삭제' })
  async delete(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    await this.svc.delete(id, user.userId)
    return ok(null, '전략이 삭제되었습니다.')
  }
}
