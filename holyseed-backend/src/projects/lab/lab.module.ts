import { Module } from '@nestjs/common';
import { LabAuthModule } from './modules/auth/auth.module';
import { LabUsersModule } from './modules/users/users.module';
import { FilmOptimizerModule } from './modules/film-optimizer/film-optimizer.module';
import { VrModule } from './modules/vr/vr.module';
import { WorklogModule } from './modules/worklog/worklog.module';
import { LabScheduleModule } from './modules/schedule/schedule.module';
import { SavingModule } from './modules/saving/saving.module';
import { LabMcpModule } from './modules/mcp/mcp.module';

@Module({
  imports: [
    LabAuthModule,
    LabUsersModule,
    FilmOptimizerModule,
    VrModule,
    WorklogModule,
    LabScheduleModule,
    SavingModule,
    LabMcpModule,
  ],
})
export class LabModule {}
