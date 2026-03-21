import type { CityData, RegionData } from '../types';

// Mock 데이터 (백엔드 API 준비 전까지 사용)
const MOCK_REGIONS: RegionData[] = [
  { id: 'incheon', name: '인천광역시' },
  { id: 'seoul', name: '서울특별시' },
  { id: 'gyeonggi', name: '경기도' },
];

const MOCK_CITIES: Record<string, CityData[]> = {
  incheon: [
    { id: 'jung-gu', name: '중구', regionId: 'incheon' },
    { id: 'dong-gu', name: '동구', regionId: 'incheon' },
    { id: 'michuhol-gu', name: '미추홀구', regionId: 'incheon' },
    { id: 'yeonsu-gu', name: '연수구', regionId: 'incheon' },
    { id: 'namdong-gu', name: '남동구', regionId: 'incheon' },
    { id: 'bupyeong-gu', name: '부평구', regionId: 'incheon' },
    { id: 'gyeyang-gu', name: '계양구', regionId: 'incheon' },
    { id: 'seo-gu', name: '서구', regionId: 'incheon' },
    { id: 'ganghwa-gun', name: '강화군', regionId: 'incheon' },
    { id: 'ongjin-gun', name: '옹진군', regionId: 'incheon' },
  ],
  seoul: [
    { id: 'gangnam-gu', name: '강남구', regionId: 'seoul' },
    { id: 'gangdong-gu', name: '강동구', regionId: 'seoul' },
    { id: 'gangbuk-gu', name: '강북구', regionId: 'seoul' },
    { id: 'gangseo-gu', name: '강서구', regionId: 'seoul' },
  ],
  gyeonggi: [
    { id: 'suwon', name: '수원시', regionId: 'gyeonggi' },
    { id: 'seongnam', name: '성남시', regionId: 'gyeonggi' },
    { id: 'goyang', name: '고양시', regionId: 'gyeonggi' },
  ],
};

/**
 * 시/도 목록 조회
 * TODO: 백엔드 API 연동 시 실제 엔드포인트로 교체
 * @returns 시/도 목록
 */
export async function getRegions(): Promise<RegionData[]> {
  // Mock 응답 (실제 API 연동 전)
  return new Promise((resolve) => {
    setTimeout(() => resolve(MOCK_REGIONS), 300);
  });

  // 실제 API 연동 예시:
  // const response = await fetch('/api/regions');
  // if (!response.ok) {
  //   throw new Error('Failed to fetch regions');
  // }
  // return response.json();
}

/**
 * 특정 시/도의 구/군 목록 조회
 * TODO: 백엔드 API 연동 시 실제 엔드포인트로 교체
 * @param regionId 시/도 ID
 * @returns 구/군 목록
 */
export async function getCitiesByRegion(regionId: string): Promise<CityData[]> {
  // Mock 응답 (실제 API 연동 전)
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(MOCK_CITIES[regionId] || []);
    }, 300);
  });

  // 실제 API 연동 예시:
  // const response = await fetch(`/api/regions/${regionId}/cities`);
  // if (!response.ok) {
  //   throw new Error(`Failed to fetch cities for region ${regionId}`);
  // }
  // return response.json();
}
