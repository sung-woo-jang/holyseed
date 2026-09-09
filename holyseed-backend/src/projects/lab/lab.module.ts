import { Module } from '@nestjs/common';
import { LabAuthModule } from './modules/auth/auth.module';
import { LabUsersModule } from './modules/users/users.module';
import { VrModule } from './modules/vr/vr.module';
import { WorklogModule } from './modules/worklog/worklog.module';
import { ExpenseModule } from './modules/expense/expense.module';
import { BacktestModule } from './modules/backtest/backtest.module';

// LabMcpModule은 더 이상 여기서 직접 안 씀 — AD MCP(ad/modules/mcp)가 import해서 쓴다
// (MCP 서버 통합, /api/ad/mcp/:token 하나로 합침).
@Module({
  imports: [LabAuthModule, LabUsersModule, VrModule, WorklogModule, ExpenseModule, BacktestModule],
})
export class LabModule {}
