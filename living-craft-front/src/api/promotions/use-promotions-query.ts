/**
 * 프로모션 관련 Query 훅
 */

import { generateQueryKeysFromUrl } from '@hooks/query-keys';
import { useQuery } from '@tanstack/react-query';

import { axiosInstance } from '../axios';
import { API } from '../endpoints';
import type { Promotion } from '../types';

/**
 * 프로모션 배너 목록 조회 훅
 * 게시 기간 내이고 활성화된 배너만 반환
 */
export function usePromotions() {
  return useQuery({
    queryKey: generateQueryKeysFromUrl(API.PROMOTIONS.LIST),
    queryFn: async (): Promise<Promotion[]> => {
      try {
        const { data } = await axiosInstance.get<Promotion[]>(API.PROMOTIONS.LIST);
        return data.data ?? [];
      } catch (error) {
        console.error('[Promotions API] 조회 실패:', error);
        return [];
      }
    },
    staleTime: 60000, // 1분
  });
}
