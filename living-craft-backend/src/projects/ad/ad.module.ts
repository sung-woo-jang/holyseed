import { Module } from '@nestjs/common';
import { AdAuthModule } from './modules/auth/auth.module';
import { AdUsersModule } from './modules/users/users.module';
import { HouseholdsModule } from './modules/households/households.module';
import { MembershipsModule } from './modules/memberships/memberships.module';
import { InvitationsModule } from './modules/invitations/invitations.module';
import { AdCategoriesModule } from './modules/categories/categories.module';

@Module({
  imports: [
    AdAuthModule,
    AdUsersModule,
    HouseholdsModule,
    MembershipsModule,
    InvitationsModule,
    AdCategoriesModule,
  ],
})
export class AdModule {}
