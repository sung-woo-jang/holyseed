import { Body, Controller, Get, Param, ParseIntPipe, Post, Request } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { McpTokenService } from './mcp-token.service';
import { CreateMcpTokenDto } from './dto/request/create-mcp-token.dto';

/**
 * claude.ai 커스텀 커넥터용 개인 MCP 토큰 관리. 일반 JWT 인증 필요(@Public 아님) —
 * 실제 MCP 프로토콜 엔드포인트(McpController, ad/mcp/:token)와는 별도 경로.
 */
@ApiTags('AD MCP 토큰')
@Controller('ad/mcp-tokens')
export class McpTokenController {
  constructor(private readonly mcpTokenService: McpTokenService) {}

  @Get()
  @ApiOperation({ summary: '내 MCP 토큰 목록 조회' })
  async list(@Request() req: any) {
    const data = await this.mcpTokenService.list(req.user.userId);
    return { success: true, message: '조회 성공', data, timestamp: new Date().toISOString() };
  }

  @Post()
  @ApiOperation({ summary: 'MCP 토큰 발급' })
  async create(@Request() req: any, @Body() dto: CreateMcpTokenDto) {
    const data = await this.mcpTokenService.create(req.user.userId, dto.label);
    return { success: true, message: '발급 성공', data, timestamp: new Date().toISOString() };
  }

  @Post(':id/delete')
  @ApiOperation({ summary: 'MCP 토큰 삭제' })
  async delete(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    await this.mcpTokenService.delete(req.user.userId, id);
    return { success: true, message: '삭제 성공', data: null, timestamp: new Date().toISOString() };
  }
}
