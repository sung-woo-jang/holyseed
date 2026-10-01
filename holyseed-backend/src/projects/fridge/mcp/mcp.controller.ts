import { Controller, NotFoundException, Param, Post, Req, Res } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { Public } from '@common/decorators';
import { FridgeMcpService } from './mcp.service';

/** Streamable HTTP MCP 엔드포인트 (stateless, POST만). 인증은 URL 경로의 개인 토큰. */
@ApiExcludeController()
@Controller('fridge/mcp')
export class FridgeMcpController {
  constructor(private readonly mcpService: FridgeMcpService) {}

  @Post(':token')
  @Public()
  async handle(@Param('token') token: string, @Req() req: Request, @Res() res: Response) {
    const user = await this.mcpService.resolveUserByToken(token);
    if (!user) throw new NotFoundException();

    const server = this.mcpService.createServer(user);
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    res.on('close', () => {
      transport.close();
      server.close();
    });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  }
}
