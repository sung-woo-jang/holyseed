import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';

// Config
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';

// Common
import { HttpExceptionFilter } from '@common/filters/http-exception.filter';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';

// Modules
import { FilesModule } from '@shared/files/files.module';
import { HealthModule } from '@shared/health/health.module';
import { IconsModule } from '@lc/modules/icons/icons.module';
import { AdminModule } from '@lc/modules/admin/admin.module';
import { UsersModule } from '@lc/modules/admin/users/users.module';
import { CustomersModule } from '@lc/modules/customers/customers.module';
import { ServicesModule } from '@lc/modules/services/services.module';
import { SettingsModule } from '@lc/modules/settings/settings.module';
import { ReservationsModule } from '@lc/modules/reservations/reservations.module';
import { ReviewsModule } from '@lc/modules/reviews/reviews.module';
import { PortfoliosModule } from '@lc/modules/portfolios/portfolios.module';
import { AddressModule } from '@shared/address/address.module';
import { FilmOptimizerModule } from '@lc/modules/film-optimizer/film-optimizer.module';
import { PromotionsModule } from '@lc/modules/promotions/promotions.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig],
      envFilePath: ['.env.local', '.env'],
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) =>
        configService.get('database'),
      inject: [ConfigService],
    }),

    // Feature modules
    FilesModule,
    HealthModule,
    IconsModule,
    UsersModule, // 전역 JwtAuthGuard에서 UsersService 사용
    AdminModule,
    CustomersModule,
    ServicesModule,
    SettingsModule,
    ReservationsModule,
    ReviewsModule,
    PortfoliosModule,
    AddressModule,
    FilmOptimizerModule,
    PromotionsModule,
  ],
  providers: [
    // Global Exception Filter
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    // Global JWT Auth Guard
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // Global Roles Guard
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
