/**
 * 제품명에서 모델명 추출 유틸리티
 */

/**
 * 제품명에서 모델명을 추출
 *
 * 추출 규칙:
 * 1. 괄호 안에서 영문+숫자 조합 찾기 (예: "(SHP2000)" → "SHP2000")
 * 2. 제품명 전체에서 영문+숫자 조합 찾기 (예: "측면내림부속SHP2000" → "SHP2000")
 * 3. 영문+숫자 조합이 없으면 null 반환 (색상/옵션은 모델명이 아님)
 *
 * @param productName 제품명
 * @returns 추출된 모델명 또는 undefined
 */
export function extractModelName(productName: string): string | undefined {
  if (!productName) {
    return undefined
  }

  // 1. 괄호 안에서 영문+숫자 조합 찾기
  // 패턴: 영문 1글자 이상 + 하이픈(선택) + 숫자 2글자 이상
  const bracketMatch = productName.match(/\(([A-Z]{1,}[-]?[0-9]{2,}[A-Z0-9]*)\)/i)
  if (bracketMatch) {
    return bracketMatch[1].toUpperCase()
  }

  // 2. 제품명 전체에서 영문+숫자 조합 찾기
  // 예: "SHP2000", "WFC-241", "A-123B"
  const alphanumericMatch = productName.match(/[A-Z]{1,}[-]?[0-9]{2,}[A-Z0-9]*/i)
  if (alphanumericMatch) {
    return alphanumericMatch[0].toUpperCase()
  }

  // 3. 모델명 없음
  return undefined
}
