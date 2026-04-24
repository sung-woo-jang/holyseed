/**
 * Levenshtein Distance 알고리즘을 사용한 문자열 유사도 계산
 * @param str1 첫 번째 문자열
 * @param str2 두 번째 문자열
 * @returns 0.0 ~ 1.0 사이의 유사도 (1.0이 완전 일치)
 */
export function calculateSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) {
    return 0;
  }

  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) {
    return 1.0;
  }

  const distance = levenshteinDistance(s1, s2);
  const maxLength = Math.max(s1.length, s2.length);

  if (maxLength === 0) {
    return 1.0;
  }

  return 1.0 - distance / maxLength;
}

/**
 * Levenshtein Distance 계산
 * @param str1 첫 번째 문자열
 * @param str2 두 번째 문자열
 * @returns 편집 거리
 */
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;

  const matrix: number[][] = Array.from({ length: len1 + 1 }, () => Array(len2 + 1).fill(0));

  for (let i = 0; i <= len1; i++) {
    matrix[i][0] = i;
  }

  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // 삭제
        matrix[i][j - 1] + 1, // 삽입
        matrix[i - 1][j - 1] + cost, // 교체
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * 문자열 포함 여부로 유사도 계산 (보조 메서드)
 * @param str1 첫 번째 문자열
 * @param str2 두 번째 문자열
 * @returns true if str1 contains str2 or vice versa
 */
export function containsString(str1: string, str2: string): boolean {
  if (!str1 || !str2) {
    return false;
  }

  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  return s1.includes(s2) || s2.includes(s1);
}
