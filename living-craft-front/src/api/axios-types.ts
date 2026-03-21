/**
 * TypedAxiosInstance
 * ApiResponse<T>를 자동으로 래핑하는 커스텀 Axios 인터페이스
 */

import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

import type { ApiResponse } from './apiResponseTypes';

/**
 * ApiResponse를 자동으로 래핑하는 커스텀 Axios 인터페이스
 *
 * 사용 예시:
 * ```typescript
 * // 기존 방식 (ApiResponse를 명시해야 함)
 * const response = await axiosInstance.get<ApiResponse<User[]>>(url)
 *
 * // 개선된 방식 (ApiResponse 자동 추론)
 * const response = await axiosInstance.get<User[]>(url)
 * // response.data 타입: ApiResponse<User[]>
 * ```
 */
export interface TypedAxiosInstance
  extends Omit<AxiosInstance, 'get' | 'post' | 'put' | 'patch' | 'delete'> {
  get<T = unknown>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<ApiResponse<T>>>;

  post<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<ApiResponse<T>>>;

  put<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<ApiResponse<T>>>;

  patch<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<ApiResponse<T>>>;

  delete<T = unknown>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<ApiResponse<T>>>;
}
