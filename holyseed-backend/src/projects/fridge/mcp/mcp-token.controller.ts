import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';
import { FridgeUserId } from '../common/decorators';
import { ok } from '../common/ok';
import { FridgeMcpTokenService } from './mcp-token.service';

class CreateMcpTokenDto {
  @IsOptional()
  @IsString()
  @Length(1, 100, { message: '이름은 1~100자여야 합니다.' })
  label?: string;
}

/** Claude 커넥터용 개인 MCP 주소 관리 (로그인 필요). 실제 MCP 엔드포인트는 FridgeMcpController(fridge/mcp/:token) */
@ApiTags('Fridge MCP')
@ApiBearerAuth()
@Controller('fridge/mcp-tokens')
export class FridgeMcpTokenController {
  constructor(private readonly service: FridgeMcpTokenService) {}

  @Get()
  @ApiOperation({ summary: '내 MCP 커넥터 주소 목록' })
  async list(@FridgeUserId() userId: number) {
    return ok('조회 성공', await this.service.list(userId));
  }

  @Post()
  @ApiOperation({ summary: 'MCP 커넥터 주소 발급' })
  async create(@FridgeUserId() userId: number, @Body() dto: CreateMcpTokenDto) {
    return ok('발급했어요.', await this.service.create(userId, dto.label));
  }
}
