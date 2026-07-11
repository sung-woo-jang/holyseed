import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdUser } from '../users/entities/ad-user.entity';
import { McpController } from './mcp.controller';
import { McpService } from './mcp.service';

@Module({
  imports: [TypeOrmModule.forFeature([AdUser]), JwtModule],
  controllers: [McpController],
  providers: [McpService],
})
export class AdMcpModule {}
