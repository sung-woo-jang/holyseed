import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FridgeAuthController } from './auth/auth.controller';
import { FridgeAuthService } from './auth/auth.service';
import { HouseholdGuard } from './common/household.guard';
import { DataController } from './data/data.controller';
import { DataService } from './data/data.service';
import {
  FridgeEvent,
  FridgeFreqItem,
  FridgeHousehold,
  FridgeHouseholdMember,
  FridgeIngredient,
  FridgeInvitation,
  FridgePerson,
  FridgeShopItem,
  FridgeUser,
} from './entities';
import { HouseholdController } from './household/household.controller';
import { HouseholdService } from './household/household.service';

/**
 * 냉장고 대시보드 (/api/fridge/*) — `fridge` DB 스키마, 자체 구글 로그인(aud: fridge), 자체 가구 모델.
 * 다른 프로젝트(ad/wedding/laofus)의 계정·테이블과 공유하는 것이 없다.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      FridgeUser,
      FridgeHousehold,
      FridgeHouseholdMember,
      FridgeInvitation,
      FridgePerson,
      FridgeFreqItem,
      FridgeIngredient,
      FridgeShopItem,
      FridgeEvent,
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: { expiresIn: '24h' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [FridgeAuthController, HouseholdController, DataController],
  providers: [FridgeAuthService, HouseholdService, DataService, HouseholdGuard],
})
export class FridgeModule {}
