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
import { WorkLogsModule } from './modules/work-logs/work-logs.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { CashflowModule } from './modules/cashflow/cashflow.module';
import { ComparisonModule } from './modules/comparison/comparison.module';

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
    WorkLogsModule,
    DashboardModule,
    CashflowModule,
    ComparisonModule,
  ],
})
export class AdModule {}
