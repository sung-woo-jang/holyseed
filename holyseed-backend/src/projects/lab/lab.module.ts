import { Module } from '@nestjs/common';
import { LabAuthModule } from './modules/auth/auth.module';
import { LabUsersModule } from './modules/users/users.module';
import { VrModule } from './modules/vr/vr.module';
import { WorklogModule } from './modules/worklog/worklog.module';
import { ExpenseModule } from './modules/expense/expense.module';
import { LabMcpModule } from './modules/mcp/mcp.module';
import { BacktestModule } from './modules/backtest/backtest.module';

@Module({
  imports: [LabAuthModule, LabUsersModule, VrModule, WorklogModule, ExpenseModule, LabMcpModule, BacktestModule],
})
export class LabModule {}
