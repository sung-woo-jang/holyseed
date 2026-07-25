import { Module } from '@nestjs/common';
import { TossClientService } from './toss-client.service';

/**
 * 토스증권 Open API 클라이언트 모듈 — laofus(SOXL)와 VR(TQQQ)이 함께 import해
 * TossClientService를 같은 프로세스 내 DI 싱글톤으로 공유한다.
 * (토스는 client당 유효 토큰이 1개뿐이라, 별도 인스턴스가 각자 토큰을 관리하면 서로 무효화시킨다.)
 */
@Module({
  providers: [TossClientService],
  exports: [TossClientService],
})
export class TossModule {}
