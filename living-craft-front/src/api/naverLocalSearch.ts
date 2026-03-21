/**
 * @deprecated 이 파일은 더 이상 사용되지 않습니다.
 * 카카오 주소 검색 API (kakaoLocalSearch.ts)를 사용하세요.
 *
 * 이전 네이버 지역 검색 API 구현입니다.
 * 주소 검색 기능이 카카오 API로 마이그레이션되었습니다.
 */

/*
import { AddressSearchResult, NaverLocalSearchItem } from '../types';

const NAVER_LOCAL_SEARCH_URL = 'https://openapi.naver.com/v1/search/local.json';

interface NaverLocalSearchResponse {
  lastBuildDate: string;
  total: number;
  start: number;
  display: number;
  items: NaverLocalSearchItem[];
}

/**
 * 네이버 지역 검색 API를 호출합니다.
 * 선택된 지역 정보를 기반으로 검색합니다.
 * @param query 검색어 (예: "숙골로")
 * @param regionPrefix 지역 접두어 (예: "인천 남동구")
 * /
export async function searchAddress(query: string, regionPrefix: string = '인천'): Promise<AddressSearchResult[]> {
  if (!query.trim()) {
    return [];
  }

  // 지역 접두어를 포함하여 검색
  const searchQuery = `${regionPrefix} ${query}`.trim();

  try {
    const params = new URLSearchParams({
      query: searchQuery,
      display: '5',
      start: '1',
      sort: 'random',
    });

    const response = await fetch(`${NAVER_LOCAL_SEARCH_URL}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'X-Naver-Client-Id': process.env.NAVER_CLIENT_ID || '',
        'X-Naver-Client-Secret': process.env.NAVER_CLIENT_SECRET || '',
      },
    });

    if (!response.ok) {
      throw new Error(`네이버 API 오류: ${response.status}`);
    }

    const data: NaverLocalSearchResponse = await response.json();

    // 선택된 지역으로 필터링 및 변환
    // regionPrefix의 첫 번째 단어 (시/도 이름)를 추출하여 필터링
    const regionName = regionPrefix.split(' ')[0];

    return data.items
      .filter((item) => {
        const address = item.roadAddress || item.address;
        return address.includes(regionName || '인천');
      })
      .map((item) => ({
        roadAddress: item.roadAddress || item.address,
        jibunAddress: item.address,
        zipCode: '', // 네이버 API는 우편번호를 제공하지 않음
      }));
  } catch (error) {
    console.error('주소 검색 오류:', error);
    return [];
  }
}
*/
