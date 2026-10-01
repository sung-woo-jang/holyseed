import { Module } from '@nestjs/common';
import { AdAuthModule } from './modules/auth/auth.module';
import { AdUsersModule } from './modules/users/users.module';
import { HouseholdsModule } from './modules/households/households.module';
import { MembershipsModule } from './modules/memberships/memberships.module';
import { InvitationsModule } from './modules/invitations/invitations.module';
import { AdCategoriesModule } from './modules/categories/categories.module';
import { AssetsModule } from './modules/assets/assets.module';
import { AssetSnapshotsModule } from './modules/asset-snapshots/asset-snapshots.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { RecurringTransactionsModule } from './modules/recurring-transactions/recurring-transactions.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { CashflowModule } from './modules/cashflow/cashflow.module';
import { ComparisonModule } from './modules/comparison/comparison.module';
import { AdMcpModule } from './modules/mcp/mcp.module';
import { VrModule } from './modules/vr/vr.module';
import { WorklogModule } from './modules/worklog/worklog.module';
import { ExpenseModule } from './modules/expense/expense.module';
import { SpacexModule } from './modules/spacex/spacex.module';

@Module({
  imports: [
    AdAuthModule,
    AdUsersModule,
    HouseholdsModule,
    MembershipsModule,
    InvitationsModule,
    AdCategoriesModule,
    AssetsModule,
    AssetSnapshotsModule,
    TransactionsModule,
    RecurringTransactionsModule,
    DashboardModule,
    CashflowModule,
    ComparisonModule,
    AdMcpModule,
    VrModule,
    WorklogModule,
    ExpenseModule,
    SpacexModule,
  ],
})
export class AdModule {}
