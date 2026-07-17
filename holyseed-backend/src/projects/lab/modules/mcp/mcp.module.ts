import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LabUser } from '../users/entities/lab-user.entity';
import { McpController } from './mcp.controller';
import { McpService } from './mcp.service';

@Module({
  imports: [TypeOrmModule.forFeature([LabUser]), JwtModule],
  controllers: [McpController],
  providers: [McpService],
})
export class LabMcpModule {}
