import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LabUser } from '../users/entities/lab-user.entity';
import { LabMcpService } from './mcp.service';

/**
 * Lab MCP 도구 제공자 — 더 이상 자체 HTTP 엔드포인트를 갖지 않는다.
 * AD MCP(ad/modules/mcp/mcp.module.ts)가 이 모듈을 import해서 LabMcpService를
 * 가져다 쓰는 방식으로 두 MCP 서버가 하나의 엔드포인트(/api/ad/mcp/:token)로 통합되어 있음.
 */
@Module({
  imports: [TypeOrmModule.forFeature([LabUser]), JwtModule],
  providers: [LabMcpService],
  exports: [LabMcpService],
})
export class LabMcpModule {}
