/**
 * 행정구역 레벨 Enum
 *
 * SIDO: 시/도 (예: 서울특별시, 경기도)
 * SIGUNGU: 시/군/구 (예: 종로구, 수원시)
 * EUPMYEONDONG: 읍/면/동 (예: 청운동, 수원시 팔달구)
 */
export enum DistrictLevel {
  SIDO = 'SIDO', // 시/도
  SIGUNGU = 'SIGUNGU', // 시/군/구
  EUPMYEONDONG = 'EUPMYEONDONG', // 읍/면/동
}
