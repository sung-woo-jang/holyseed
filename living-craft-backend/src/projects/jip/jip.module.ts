import { Module } from '@nestjs/common';
import { JipAuthModule } from './modules/auth/jip-auth.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { CasesModule } from './modules/cases/cases.module';
import { RequestsModule } from './modules/requests/requests.module';
import { JipScheduleModule } from './modules/schedule/schedule.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { JipUploadsModule } from './modules/uploads/uploads.module';
import { JipDashboardModule } from './modules/dashboard/dashboard.module';
import { SiteAssetsModule } from './modules/site-assets/site-assets.module';

@Module({
  imports: [
    JipAuthModule,
    CatalogModule,
    CasesModule,
    RequestsModule,
    JipScheduleModule,
    JobsModule,
    JipUploadsModule,
    JipDashboardModule,
    SiteAssetsModule,
  ],
})
export class JipModule {}
