/**
 * 사용자 관련 Query 훅
 */

import { generateQueryKeysFromUrl } from '@hooks/query-keys';
import { MOCK_REVIEWS, MOCK_USER, mockDelay } from '@mocks';
import { useQuery } from '@tanstack/react-query';

import { axiosInstance } from '../axios';
import { API } from '../endpoints';
import type { MyReviewsParams, Review, User } from '../types';

/**
 * 내 정보 조회 훅
 */
export function useMe() {
  return useQuery({
    queryKey: generateQueryKeysFromUrl(API.USERS.ME),
    queryFn: async (): Promise<User> => {
      // 개발 환경에서는 Mock 데이터 반환
      if (__DEV__) {
        console.log('[Mock API] GET /users/me');
        await mockDelay(300);
        return MOCK_USER;
      }

      const { data } = await axiosInstance.get<User>(API.USERS.ME);
      return data.data;
    },
    staleTime: 300000, // 5분
  });
}

/**
 * 내 리뷰 목록 조회 훅
 */
export function useMyReviews(params?: MyReviewsParams) {
  return useQuery({
    queryKey: [...generateQueryKeysFromUrl(API.USERS.MY_REVIEWS), params],
    queryFn: async (): Promise<Review[]> => {
      // 개발 환경에서는 Mock 데이터 반환
      if (__DEV__) {
        console.log('[Mock API] GET /users/me/reviews');
        await mockDelay(400);
        return MOCK_REVIEWS;
      }

      const { data } = await axiosInstance.get<Review[]>(API.USERS.MY_REVIEWS, {
        params,
      });
      return data.data;
    },
  });
}
