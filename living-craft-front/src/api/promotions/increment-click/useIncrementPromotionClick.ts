/**
 * 프로모션 클릭 통계 증가 Mutation 훅
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { generateQueryKeysFromUrl } from '../../../hooks/query-keys';
import { axiosInstance } from '../../axios';
import { API } from '../../endpoints';

/**
 * 프로모션 클릭 통계 증가 API 함수
 */
async function incrementPromotionClick(id: number): Promise<void> {
  await axiosInstance.post(API.PROMOTIONS.CLICK(id));
}

/**
 * 프로모션 클릭 통계 증가 훅
 */
export function useIncrementPromotionClick() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: incrementPromotionClick,
    onSuccess: () => {
      // 클릭 후 목록 갱신 (옵션, 통계 반영 시)
      queryClient.invalidateQueries({
        queryKey: generateQueryKeysFromUrl(API.PROMOTIONS.LIST),
      });
    },
  });
}
