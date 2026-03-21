import { AddressSearchResult, KakaoAddressSearchResponse } from '../types';

const KAKAO_ADDRESS_SEARCH_URL = 'https://dapi.kakao.com/v2/local/search/address.json';
const KAKAO_REST_API_KEY = process.env.KAKAO_REST_API_KEY || '341a2f56851ca4d93327ae6894a27aad';

/**
 * 카카오 주소 검색 API를 호출합니다.
 * 선택된 지역 정보를 기반으로 검색합니다.
 * @param query 검색어 (예: "숙골로")
 * @param regionPrefix 지역 접두어 (예: "인천광역시 남동구")
 */
export async function searchAddress(
  query: string,
  regionPrefix: string = '인천'
): Promise<AddressSearchResult[]> {
  if (!query.trim()) {
    return [];
  }

  // 지역 접두어를 포함하여 검색
  const searchQuery = `${regionPrefix} ${query}`.trim();

  try {
    const params = new URLSearchParams({
      query: searchQuery,
      analyze_type: 'similar', // 유사 매칭 허용
      page: '1',
      size: '10',
    });

    const response = await fetch(`${KAKAO_ADDRESS_SEARCH_URL}?${params.toString()}`, {
      method: 'GET',
      headers: {
        Authorization: `KakaoAK ${KAKAO_REST_API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`카카오 API 오류: ${response.status}`);
    }

    const data: KakaoAddressSearchResponse = await response.json();

    return data.documents
      .map((doc) => ({
        roadAddress: doc.road_address?.address_name || doc.address?.address_name || '',
        jibunAddress: doc.address?.address_name || '',
        zipCode: doc.road_address?.zone_no || '',
      }))
      .filter((result) => result.roadAddress || result.jibunAddress); // 빈 결과 제외
  } catch (error) {
    console.error('주소 검색 오류:', error);
    return [];
  }
}
