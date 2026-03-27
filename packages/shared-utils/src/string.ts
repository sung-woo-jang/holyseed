/**
 * 문자열을 자르고 말줄임표(...)를 추가합니다.
 * @param str - 자를 문자열
 * @param maxLength - 최대 길이
 * @returns 잘린 문자열 (필요시 ... 추가)
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) {
    return str
  }
  return str.slice(0, maxLength) + '...'
}

/**
 * 문자열을 kebab-case로 변환합니다.
 * @param str - 변환할 문자열
 * @returns kebab-case 문자열
 */
export function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase()
}

/**
 * 문자열을 camelCase로 변환합니다.
 * @param str - 변환할 문자열
 * @returns camelCase 문자열
 */
export function toCamelCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/[-_\s](.)/g, (_, char) => char.toUpperCase())
}

/**
 * 숫자를 천 단위 콤마로 포맷팅합니다.
 * @param num - 포맷팅할 숫자
 * @returns 포맷팅된 문자열 (예: '1,000,000')
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('ko-KR')
}

/**
 * 금액을 원화 형식으로 포맷팅합니다.
 * @param amount - 포맷팅할 금액
 * @returns 포맷팅된 문자열 (예: '1,000,000원')
 */
export function formatCurrency(amount: number): string {
  return `${formatNumber(amount)}원`
}
