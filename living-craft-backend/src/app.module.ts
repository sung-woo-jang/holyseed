import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';

// Config
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';

// Common
import { HttpExceptionFilter } from '@common/filters/http-exception.filter';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { JwtStrategy } from '@common/strategies/jwt.strategy';

// Modules
import { SharedModule } from '@/shared/shared.module';
import { AdModule } from '@/projects/ad/ad.module';
import { IvModule } from '@/projects/iv/iv.module';
import { WeddingModule } from '@/projects/wedding/wedding.module';

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

    // Auth
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret') || 'default-secret',
        signOptions: { expiresIn: (configService.get<string>('jwt.expiresIn') || '24h') as any },
      }),
      inject: [ConfigService],
    }),

    // Schedule (cron jobs)
    ScheduleModule.forRoot(),

    // Feature modules
    SharedModule, // 공유 모듈 (files, health, address)
    AdModule, // Asset Diary 프로젝트 통합 모듈 (/api/ad/* 경로)
    IvModule, // Infinite+VR 자동매매 (/api/iv/* 경로)
    WeddingModule, // 결혼식 아카이브 (/api/wedding/* 경로)
  ],
  providers: [
    JwtStrategy,
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
