import { Module } from '@nestjs/common';
import { TypeOrmModule, getDataSourceToken } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { WeddingAuthController } from './auth.controller';
import { WeddingAuthService } from './auth.service';
import { WeddingUser } from './entities/wedding-user.entity';
import { Couple } from '../couples/entities/couple.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([WeddingUser, Couple]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET'),
        signOptions: { expiresIn: config.get('JWT_EXPIRES_IN', '24h') },
      }),
    }),
  ],
  controllers: [WeddingAuthController],
  providers: [
    WeddingAuthService,
    { provide: DataSource, useExisting: getDataSourceToken() },
  ],
  exports: [WeddingAuthService],
})
export class WeddingAuthModule {}
