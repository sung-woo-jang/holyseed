import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LabMcpModule } from '@lab/modules/mcp/mcp.module';
import { McpToken } from './entities/mcp-token.entity';
import { McpController } from './mcp.controller';
import { McpService } from './mcp.service';
import { McpTokenController } from './mcp-token.controller';
import { McpTokenService } from './mcp-token.service';

@Module({
  imports: [TypeOrmModule.forFeature([McpToken]), JwtModule, LabMcpModule],
  controllers: [McpController, McpTokenController],
  providers: [McpService, McpTokenService],
})
export class AdMcpModule {}
