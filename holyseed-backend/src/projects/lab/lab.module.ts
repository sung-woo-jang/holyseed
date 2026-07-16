import { Module } from '@nestjs/common';
import { LabAuthModule } from './modules/auth/auth.module';
import { LabUsersModule } from './modules/users/users.module';
import { FilmOptimizerModule } from './modules/film-optimizer/film-optimizer.module';

@Module({
  imports: [LabAuthModule, LabUsersModule, FilmOptimizerModule],
})
export class LabModule {}
