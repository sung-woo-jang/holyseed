import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PcUser } from './entities/pc-user.entity';
import { PcAuthService } from './pc-auth.service';
import { PcAuthController } from './pc-auth.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([PcUser]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret') || 'default-secret',
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [PcAuthController],
  providers: [PcAuthService],
})
export class PcAuthModule {}
