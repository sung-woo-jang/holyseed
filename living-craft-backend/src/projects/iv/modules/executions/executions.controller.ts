import { Body, Controller, Get, Param, Post } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { Public } from '@common/decorators'
import { ExecutionsService } from './executions.service'
import { CreateExecutionsDto } from './dto/request/create-executions.dto'

const ok = (data: unknown, message = '성공') => ({
  success: true, message, data, timestamp: new Date().toISOString(),
})

@ApiTags('IV 체결')
@Controller('iv/strategies')
@Public()
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
}
