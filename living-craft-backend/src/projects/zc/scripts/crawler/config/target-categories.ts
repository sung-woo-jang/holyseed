/**
 * 사이트별 타겟 카테고리 설정
 *
 * ZC 사업과 관련된 제품 카테고리만 정의합니다.
 * - 주로 욕실 제품 위주
 * - 주방 제품은 일부만 포함 (추후 확장 가능)
 */

/**
 * 다시스 타겟 카테고리
 *
 * 카테고리 구조:
 * - 002xxx: 양변기
 * - 003xxx: 세면대
 * - 004xxx: 수전
 * - 007xxx: 욕실장
 */
export const DASIS_TARGET_CATEGORIES: Record<string, string> = {
  // 양변기
  '002003': '원피스',
  '002005': '투피스',
  '002007': '비데',
  '002006': '양변기부품',
  '002008': '양변기시트',

  // 세면대
  '003001': '반다리세면기',
  '003002': '긴다리세면기',
  '003004': '탑볼세면기',
  '003005': '세면기부품',

  // 수전
  '004001': '세면수전',
  '004003': '샤워수전',
  '004004': '해바라기샤워기수전',
  '004007': '샤워겸용세면수전',
  '004010': '탑볼세면수전',
  '004005': '주방수전',

  // 욕실장
  '007002': '욕실장',
  '007003': '슬라이딩욕실장',
  '007004': '플랩욕실장',
  '007007': '하부장',
}

/**
 * 우리욕실 타겟 카테고리
 *
 * 카테고리 구조:
 * - 번호 기반 ID 시스템
 */
export const WOORIBATH_TARGET_CATEGORIES: Record<string, string> = {
  // 양변기/비데
  '328': '양변기/비데',

  // 세면대
  '76': '세면대',

  // 수전
  '135': '수전',

  // 악세사리
  '223': '악세사리',
  '209': '슬라이드바',

  // 환풍기
  '627': '환풍기',

  // 거울
  '386': '거울',

  // 부속품
  '292': '부속품',
}

/**
 * 사이트별 타겟 카테고리 매핑
 */
export const TARGET_CATEGORIES = {
  dasis: DASIS_TARGET_CATEGORIES,
  wooribath: WOORIBATH_TARGET_CATEGORIES,
} as const

/**
 * 타겟 카테고리 타입
 */
export type SiteName = keyof typeof TARGET_CATEGORIES

/**
 * 특정 사이트의 타겟 카테고리 목록 반환
 */
export function getTargetCategories(site: SiteName): string[] {
  return Object.keys(TARGET_CATEGORIES[site])
}

/**
 * 특정 카테고리가 타겟인지 확인
 */
export function isTargetCategory(site: SiteName, categoryCode: string): boolean {
  return categoryCode in TARGET_CATEGORIES[site]
}

/**
 * 타겟 카테고리 정보 출력용
 */
export function getTargetCategoryInfo(site: SiteName): Array<{ code: string; name: string }> {
  return Object.entries(TARGET_CATEGORIES[site]).map(([code, name]) => ({
    code,
    name,
  }))
}
