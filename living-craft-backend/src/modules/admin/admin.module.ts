import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DistrictsModule } from '@modules/admin/districts';
import { AdminReservationsModule } from '@modules/admin/reservations';
import { AdminServicesModule } from '@modules/admin/services';
import { AdminPortfoliosModule } from '@modules/admin/portfolios';
import { AdminReviewsModule } from '@modules/admin/reviews';
import { AdminCustomersModule } from '@modules/admin/customers';
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
