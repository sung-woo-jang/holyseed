/**
 * 서비스 관련 Query 훅 및 API 함수
 */

import { generateQueryKeysFromUrl } from '@hooks/query-keys';
import { useQuery } from '@tanstack/react-query';

import { axiosInstance } from '../axios';
import { API } from '../endpoints';
import type {
  AvailableDatesRequest,
  AvailableDatesResponse,
  AvailableTimesRequest,
  AvailableTimesResponse,
  Service,
  TimeType,
} from '../types';

/**
 * 서비스 목록 조회 API 함수
 * Store 등에서 직접 호출할 때 사용
 */
export async function getServices(): Promise<Service[]> {
  const { data } = await axiosInstance.get<Service[]>(API.SERVICES.LIST);

  // Backend 응답의 id가 string이므로 number로 변환
  return data.data.map((service) => ({
    ...service,
    id: typeof service.id === 'string' ? parseInt(service.id, 10) : service.id,
  }));
}

/**
 * 서비스 목록 조회 훅
 */
export function useServices() {
  return useQuery({
    queryKey: generateQueryKeysFromUrl(API.SERVICES.LIST),
    queryFn: getServices,
    staleTime: 300000, // 5분 (서비스 정보는 자주 바뀌지 않음)
  });
}

/**
 * 예약 가능 시간 조회 훅
 * @param serviceId 서비스 ID
 * @param date 조회 날짜 (YYYY-MM-DD)
 * @param type 시간 타입 (estimate: 견적, construction: 시공)
 * @param enabled 쿼리 활성화 여부
 */
export function useAvailableTimes(
  serviceId: number,
  date: string,
  type: TimeType,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ['available-times', serviceId, date, type],
    queryFn: async () => {
      const params: AvailableTimesRequest = { serviceId, date, type };
      const { data } = await axiosInstance.post<AvailableTimesResponse>(
        API.SERVICES.AVAILABLE_TIMES,
        params
      );
      return data.data;
    },
    enabled: enabled && serviceId > 0 && !!date,
    staleTime: 60000, // 1분
  });
}

/**
 * 월별 예약 가능 날짜 조회 훅
 * - 캘린더에서 예약 불가능한 날짜를 disabled 처리하기 위해 사용
 *
 * @param serviceId 서비스 ID
 * @param year 조회 연도
 * @param month 조회 월 (1-12)
 * @param type 시간 타입 (estimate: 견적, construction: 시공)
 * @param enabled 쿼리 활성화 여부
 */
export function useAvailableDates(
  serviceId: number,
  year: number,
  month: number,
  type: TimeType,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ['available-dates', serviceId, year, month, type],
    queryFn: async () => {
      const params: AvailableDatesRequest = { serviceId, year, month, type };
      const { data } = await axiosInstance.post<AvailableDatesResponse>(
        API.SERVICES.AVAILABLE_DATES,
        params
      );
      return data.data;
    },
    enabled: enabled && serviceId > 0 && year > 0 && month > 0,
    staleTime: 60000, // 1분
  });
}
