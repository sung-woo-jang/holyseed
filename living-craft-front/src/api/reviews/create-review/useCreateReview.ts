/**
 * 리뷰 작성 Mutation 훅
 */

import type { CreateReviewRequest, Review } from '@api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { showSuccessToast } from '@utils/toast';

import { generateQueryKeysFromUrl } from '../../../hooks/query-keys';
import { axiosInstance } from '../../axios';
import { API } from '../../endpoints';

/**
 * 리뷰 작성 API 함수
 */
async function createReview(data: CreateReviewRequest): Promise<Review> {
  const { data: response } = await axiosInstance.post<Review>(API.REVIEWS.CREATE, data);
  return response.data;
}

/**
 * 리뷰 작성 훅
 */
export function useCreateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createReview,
    onSuccess: () => {
      // 리뷰 목록 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: generateQueryKeysFromUrl(API.REVIEWS.LIST),
      });
      queryClient.invalidateQueries({ queryKey: ['my-reviews'] });
      showSuccessToast('리뷰가 등록되었습니다.');
    },
  });
}
