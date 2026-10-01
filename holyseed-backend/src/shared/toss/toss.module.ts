import { Module } from '@nestjs/common';
import { TossClientService } from './toss-client.service';
import { TossPriceHubService } from './toss-price-hub.service';

/**
 * 토스증권 Open API 클라이언트 모듈 — laofus(SOXL)와 VR(TQQQ)이 함께 import해
 * TossClientService를 같은 프로세스 내 DI 싱글톤으로 공유한다.
 * (토스는 client당 유효 토큰이 1개뿐이라, 별도 인스턴스가 각자 토큰을 관리하면 서로 무효화시킨다.)
 * TossPriceHubService는 화면용 가격 조회(5초 재사용·동시 요청 합치기·429 시 물러서기) — 주문 엔진은 쓰지 않는다.
 */
@Module({
  providers: [TossClientService, TossPriceHubService],
  exports: [TossClientService, TossPriceHubService],
})
export class TossModule {}
