import { SetMetadata } from '@nestjs/common';

export const OWNER_ONLY_KEY = 'ownerOnly';

export interface OwnerOnlyOptions {
  /**
   * 예전엔 인증 없이 열려 있던 엔드포인트(라오어 조회)라 앱 업데이트 전 기기가 토큰 없이 호출한다.
   * OWNER_ONLY=false(점검·롤아웃 단계)일 때만 이전처럼 익명을 허용한다.
   */
  legacyPublic?: boolean;
}

/** 소유자 계정(OWNER_USER_ID / MCP_OWNER_EMAIL)만 접근 — 실주문·근무일지·지출처럼 가구 단위가 아닌 개인 영역용 */
export const OwnerOnly = (options: OwnerOnlyOptions = {}) => SetMetadata(OWNER_ONLY_KEY, options);
