/**
 * 리뷰 관련 Query 훅
 */

import { generateQueryKeysFromUrl } from '@hooks/query-keys';
import { useQuery } from '@tanstack/react-query';

import { convertPageToOffset } from '../apiResponseTypes';
import { axiosInstance } from '../axios';
import { API } from '../endpoints';
import type { PaginatedResponse, Review, ReviewListParams } from '../types';

/**
 * 리뷰 목록 조회 훅
 */
export function useReviews(params?: ReviewListParams) {
  return useQuery({
    queryKey: [...generateQueryKeysFromUrl(API.REVIEWS.LIST), params],
    queryFn: async () => {
      // page를 offset으로 변환하여 백엔드로 전송
      const backendParams = params
        ? {
            ...convertPageToOffset(params),
            serviceId: params.serviceId,
            rating: params.rating,
          }
        : undefined;

      const { data } = await axiosInstance.get<PaginatedResponse<Review>>(
        API.REVIEWS.LIST,
        { params: backendParams }
      );
      return data.data;
    },
    staleTime: 60000, // 1분
  });
}
