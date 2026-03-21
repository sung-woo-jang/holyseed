/**
 * 표준 Query/Mutation 훅
 * ApiResponse<T> 형태의 응답을 처리
 */

import {
  useMutation,
  type UseMutationOptions,
  useQuery,
  type UseQueryOptions,
} from '@tanstack/react-query';

import type { ApiResponse } from '../api/apiResponseTypes';

/**
 * 표준 Mutation 훅
 * ApiResponse<TData> 형태의 응답을 처리
 */
export function useStandardMutation<
  TData = unknown,
  TError = Error,
  TVariables = void,
>(options?: UseMutationOptions<ApiResponse<TData>, TError, TVariables>) {
  return useMutation<ApiResponse<TData>, TError, TVariables>({
    ...options,
  });
}

/**
 * 표준 Query 훅
 * ApiResponse<TData> 형태의 응답을 처리
 */
export function useStandardQuery<
  TData = unknown,
  TError = Error,
  TQueryData = ApiResponse<TData>,
  TQueryKey extends readonly unknown[] = unknown[],
>(options: UseQueryOptions<ApiResponse<TData>, TError, TQueryData, TQueryKey>) {
  return useQuery<ApiResponse<TData>, TError, TQueryData, TQueryKey>(options);
}
