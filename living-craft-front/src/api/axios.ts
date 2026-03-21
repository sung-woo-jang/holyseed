/**
 * Living Craft API Client
 * TypedAxiosInstance를 사용한 타입 안전한 Axios 인스턴스
 */

import axios, { AxiosError, type AxiosRequestConfig } from 'axios';

import { useAuthStore } from '../store/authStore';
import { showErrorToast } from '../utils/toast';
import type { ErrorResponse } from './apiResponseTypes';
import type { TypedAxiosInstance } from './axios-types';

/**
 * Content-Type 열거형
 */
export enum ContentType {
  Json = 'application/json',
  FormData = 'multipart/form-data',
  UrlEncoded = 'application/x-www-form-urlencoded',
  Text = 'text/plain',
}

/**
 * API 베이스 URL
 * 환경 변수에서 API_BASE_URL을 가져오거나 기본값 사용
 */
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000/api';

// 디버깅용 로그
if (__DEV__) {
  console.log('[API Client] Base URL:', BASE_URL);
}

/**
 * Axios 인스턴스 생성 함수
 */
const createAxiosInstance = (contentType: string, baseURL: string): TypedAxiosInstance => {
  const config: AxiosRequestConfig = {
    baseURL,
    timeout: 30000, // 30초
    headers: {
      'Content-Type': contentType,
    },
  };

  const instance = axios.create(config);

  // Request 인터셉터 - Authorization 헤더 자동 추가
  instance.interceptors.request.use(
    (requestConfig) => {
      try {
        const token = useAuthStore.getState().accessToken;
        if (token) {
          requestConfig.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.error('Failed to get auth token:', error);
      }
      return requestConfig;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response 인터셉터 - 에러 처리
  instance.interceptors.response.use(
    (response) => {
      // 응답 그대로 반환 (ApiResponse<T> 구조 유지)
      return response;
    },
    async (error: AxiosError<ErrorResponse>) => {
      const { response } = error;

      if (!response) {
        showErrorToast('네트워크 연결을 확인해주세요.');
        return Promise.reject(error);
      }

      const { status, data } = response;
      const errorMessage = data?.message || '오류가 발생했습니다.';

      switch (status) {
        case 401: {
          // 토큰 만료 - 로그아웃 처리
          // TODO: 토큰 갱신 로직 구현
          console.error('Unauthorized: Token expired or invalid');
          useAuthStore.getState().logout();
          showErrorToast('인증이 만료되었습니다. 다시 로그인해주세요.');
          break;
        }

        case 403:
          showErrorToast('접근 권한이 없습니다.');
          break;

        case 404:
          showErrorToast('요청한 리소스를 찾을 수 없습니다.');
          break;

        case 400:
          showErrorToast(errorMessage);
          break;

        case 500:
          showErrorToast('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
          break;

        default:
          showErrorToast(errorMessage);
      }

      if (__DEV__) {
        console.error('API Error:', {
          statusCode: status,
          message: errorMessage,
          path: data?.path,
        });
      }

      return Promise.reject(error);
    }
  );

  return instance as TypedAxiosInstance;
};

/**
 * JSON 요청용 Axios 인스턴스
 */
export const axiosInstance = createAxiosInstance(ContentType.Json, BASE_URL);

/**
 * FormData 요청용 Axios 인스턴스 (파일 업로드 등)
 */
export const formInstance = createAxiosInstance(ContentType.FormData, BASE_URL);

/**
 * 기존 호환성을 위한 default export
 * @deprecated axiosInstance를 직접 import하세요
 */
export default axiosInstance;
