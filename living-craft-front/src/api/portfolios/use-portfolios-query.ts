/**
 * 포트폴리오 관련 Query 훅
 */

import { generateQueryKeysFromUrl } from '@hooks/query-keys';
import { useQuery } from '@tanstack/react-query';

import { convertPageToOffset } from '../apiResponseTypes';
import { axiosInstance } from '../axios';
import { API } from '../endpoints';
import type {
  PaginatedResponse,
  Portfolio,
  PortfolioDetailDto,
  PortfolioListParams,
  PortfolioListResponseDto,
  Service,
} from '../types';

/**
 * 포트폴리오 목록 조회 훅
 */
export function usePortfolios(params?: PortfolioListParams) {
  return useQuery({
    queryKey: [...generateQueryKeysFromUrl(API.PORTFOLIOS.LIST), params],
    queryFn: async (): Promise<PaginatedResponse<Portfolio>> => {
      // page를 offset으로 변환하여 백엔드로 전송
      const backendParams = params
        ? {
            ...convertPageToOffset(params),
            category: params.category,
          }
        : undefined;

      const { data } = await axiosInstance.get<PortfolioListResponseDto>(
        API.PORTFOLIOS.LIST,
        { params: backendParams }
      );

      const { items, total } = data.data;
      const limit = params?.limit || 10;

      // 백엔드 DTO → 프론트엔드 Portfolio 변환
      const portfolios: Portfolio[] = items.map((item) => ({
        id: Number(item.id),
        category: item.category,
        projectName: item.projectName,
        description: item.description,
        images: item.thumbnailImage ? [item.thumbnailImage] : [],
        tags: item.tags || [],
        // 목록에서는 제공되지 않는 필드들 (상세에서만 제공)
        client: undefined,
        duration: '',
        detailedDescription: '',
        service: {} as Service,
        serviceId: 0,
        isActive: true,
        sortOrder: 0,
        createdAt: '',
        updatedAt: '',
      }));

      return {
        success: true,
        message: '포트폴리오 목록 조회 성공',
        data: portfolios,
        meta: {
          currentPage: params?.page || 1,
          itemsPerPage: limit,
          totalItems: total,
          totalPages: Math.ceil(total / limit),
          hasNextPage: (params?.page || 1) * limit < total,
          hasPreviousPage: (params?.page || 1) > 1,
        },
        timestamp: new Date().toISOString(),
      };
    },
    staleTime: 300000, // 5분
  });
}

/**
 * 포트폴리오 상세 조회 훅
 */
export function usePortfolio(id: number, enabled: boolean = true) {
  return useQuery({
    queryKey: ['portfolio', id],
    queryFn: async (): Promise<Portfolio> => {
      const { data } = await axiosInstance.get<PortfolioDetailDto>(
        API.PORTFOLIOS.DETAIL(id)
      );

      const detail = data.data;

      return {
        id: Number(detail.id),
        category: detail.category,
        projectName: detail.projectName,
        client: detail.client,
        duration: detail.duration,
        description: '',
        detailedDescription: detail.detailedDescription,
        images: detail.images || [],
        tags: detail.tags || [],
        service: {} as Service,
        serviceId: Number(detail.relatedServiceId),
        isActive: true,
        sortOrder: 0,
        createdAt: '',
        updatedAt: '',
      };
    },
    enabled: enabled && !!id,
    staleTime: 300000, // 5분
  });
}
