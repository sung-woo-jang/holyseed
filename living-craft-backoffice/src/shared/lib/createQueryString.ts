/**
 * URL 쿼리 스트링을 생성하는 유틸리티 함수
 * @param params - 쿼리 파라미터 객체
 * @returns 생성된 쿼리 스트링 ('?' 접두사 포함)
 * @example
 * createQueryString({ page: 1, tags: ['react', 'typescript'] })
 * // Returns: "?page=1&tags=react,typescript"
 */
const createQueryString = <T extends Record<string, unknown>>(
  params: T | null | undefined
): string => {
  // null, undefined 체크
  if (!params || typeof params !== 'object') {
    return ''
  }

  // 유효한 값만 필터링
  const validEntries = Object.entries(params).filter(
    ([_, value]) => value !== undefined && value !== null
  )

  if (validEntries.length === 0) return ''

  // 키를 알파벳 순으로 정렬
  const validParams = Object.fromEntries(validEntries)
  const sortedKeys = Object.keys(validParams).sort()
  const searchParams = new URLSearchParams()

  sortedKeys.forEach((key) => {
    const value = validParams[key]
    const stringValue = Array.isArray(value) ? value.join(',') : String(value)
    searchParams.append(key, stringValue)
  })

  return `?${searchParams.toString()}`
}

export { createQueryString }
