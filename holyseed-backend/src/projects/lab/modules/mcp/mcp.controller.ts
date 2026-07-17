import { Controller, NotFoundException, Param, Post, Req, Res } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { Public } from '@common/decorators';
import { McpService } from './mcp.service';

/**
 * Streamable HTTP MCP 엔드포인트 (stateless — POST만 사용).
 * 인증: URL 경로 시크릿 (claude.ai 커스텀 커넥터가 헤더를 못 넣으므로).
 */
@ApiExcludeController()
@Controller('lab/mcp')
export class McpController {
  constructor(private readonly mcpService: McpService) {}

  @Post(':secret')
  @Public()
  async handle(@Param('secret') secret: string, @Req() req: Request, @Res() res: Response) {
    const expected = this.mcpService.secret;
    if (!expected || secret !== expected) {
      throw new NotFoundException();
    }

    // 요청마다 새 서버/트랜스포트 (세션리스)
    const server = this.mcpService.createServer();
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });

    res.on('close', () => {
      transport.close();
      server.close();
    });

    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  }
}
