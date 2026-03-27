import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DistrictsModule } from '@lc/modules/admin/districts';
import { AdminReservationsModule } from '@lc/modules/admin/reservations';
import { AdminServicesModule } from '@lc/modules/admin/services';
import { AdminPortfoliosModule } from '@lc/modules/admin/portfolios';
import { AdminReviewsModule } from '@lc/modules/admin/reviews';
import { AdminCustomersModule } from '@lc/modules/admin/customers';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    DistrictsModule,
    AdminReservationsModule,
    AdminServicesModule,
    AdminPortfoliosModule,
    AdminReviewsModule,
    AdminCustomersModule,
    DashboardModule,
  ],
  exports: [UsersModule], // JwtAuthGuard에서 UsersService 사용
})
export class AdminModule {}
