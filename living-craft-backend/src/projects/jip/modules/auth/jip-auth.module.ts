import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JipUser } from './entities/jip-user.entity';
import { JipAuthService } from './jip-auth.service';
import { JipAuthController } from './jip-auth.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([JipUser]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret') || 'default-secret',
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [JipAuthController],
  providers: [JipAuthService],
  exports: [JipAuthService],
})
export class JipAuthModule {}
