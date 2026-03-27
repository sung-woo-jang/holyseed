import { Module } from '@nestjs/common';

// Living Craft 프로젝트 모듈
import { IconsModule } from '@lc/modules/icons/icons.module';
import { AdminModule } from '@lc/modules/admin/admin.module';
import { UsersModule } from '@lc/modules/admin/users/users.module';
import { CustomersModule } from '@lc/modules/customers/customers.module';
import { ServicesModule } from '@lc/modules/services/services.module';
import { SettingsModule } from '@lc/modules/settings/settings.module';
import { ReservationsModule } from '@lc/modules/reservations/reservations.module';
import { ReviewsModule } from '@lc/modules/reviews/reviews.module';
import { PortfoliosModule } from '@lc/modules/portfolios/portfolios.module';
import { FilmOptimizerModule } from '@lc/modules/film-optimizer/film-optimizer.module';
import { PromotionsModule } from '@lc/modules/promotions/promotions.module';

/**
 * LivingCraftModule
 *
 * Living Craft 프로젝트의 모든 모듈을 통합 관리합니다.
 *
 * 포함된 모듈:
 * - IconsModule: 아이콘 관리
 * - AdminModule: 관리자 기능 (백오피스)
 * - UsersModule: 관리자 사용자 관리
 * - CustomersModule: 고객 인증 및 관리
 * - ServicesModule: 서비스 목록 및 상세
 * - SettingsModule: 운영 설정 (운영 시간, 휴무일)
 * - ReservationsModule: 예약 관리
 * - ReviewsModule: 리뷰 관리
 * - PortfoliosModule: 포트폴리오 관리
 * - FilmOptimizerModule: 필름 최적화 도구
 * - PromotionsModule: 프로모션 배너 관리
 */
@Module({
  imports: [
    IconsModule,
    UsersModule, // 전역 JwtAuthGuard에서 UsersService 사용
    AdminModule,
    CustomersModule,
    ServicesModule,
    SettingsModule,
    ReservationsModule,
    ReviewsModule,
    PortfoliosModule,
    FilmOptimizerModule,
    PromotionsModule,
  ],
  exports: [
    IconsModule,
    UsersModule,
    AdminModule,
    CustomersModule,
    ServicesModule,
    SettingsModule,
    ReservationsModule,
    ReviewsModule,
    PortfoliosModule,
    FilmOptimizerModule,
    PromotionsModule,
  ],
})
export class LivingCraftModule {}
