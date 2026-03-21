/**
 * Query Key 생성 유틸리티
 */

/**
 * URL 문자열을 받아 쿼리 키 배열을 생성합니다.
 *
 * @param url - 쿼리 키로 변환할 URL 문자열
 * @returns 쿼리 키 문자열 배열
 *
 * @example
 * const queryKey = generateQueryKeysFromUrl('/services/123/posts?sort=date&order=desc');
 * console.log(queryKey); // ['services', '123', 'posts', 'sort=date', 'order=desc']
 */
export const generateQueryKeysFromUrl = (url: string): string[] => {
  // URL에서 쿼리 문자열 분리
  const [urlPath, queryString] = url.split('?');

  // 경로 부분을 슬래시로 분할하고 빈 문자열과 'api' 제거
  const pathKeys = (urlPath ?? '')
    .split('/')
    .filter((segment) => segment !== '' && segment !== 'api');

  // 쿼리 파라미터 처리
  const queryParams = queryString ? queryString.split('&') : [];

  // 경로 키와 쿼리 파라미터를 합쳐서 반환
  return [...pathKeys, ...queryParams];
};
