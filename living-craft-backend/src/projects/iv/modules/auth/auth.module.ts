import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { JwtModule } from '@nestjs/jwt'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { IvUser } from '../../entities/iv-user.entity'
import { IvAuthService } from './auth.service'
import { IvAuthController } from './auth.controller'

@Module({
  imports: [
    TypeOrmModule.forFeature([IvUser]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (cfg: ConfigService) => ({
        secret: cfg.get<string>('jwt.secret') || 'default-secret',
        signOptions: { expiresIn: '30d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [IvAuthController],
  providers: [IvAuthService],
})
export class IvAuthModule {}
