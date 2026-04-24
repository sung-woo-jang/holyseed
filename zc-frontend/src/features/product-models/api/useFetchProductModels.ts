import { useQuery } from '@tanstack/react-query';
import { axiosInstance } from '@/shared/api/axios';
import { ZC_API } from '@/shared/api/endpoints';
import type { ProductModelQueryParams, ProductModelListResponse } from '../types';

export function useFetchProductModels(params: ProductModelQueryParams = {}) {
  return useQuery({
    queryKey: ['product-models', params],
    queryFn: async () => {
      // 파라미터가 있으면 POST로 검색, 없으면 GET으로 전체 조회
      if (Object.keys(params).length > 0) {
        const response = await axiosInstance.post<ProductModelListResponse>(
          ZC_API.PRODUCT_MODELS.SEARCH,
          params
        );
        return response.data;
      } else {
        const response = await axiosInstance.get<ProductModelListResponse>(
          ZC_API.PRODUCT_MODELS.LIST
        );
        return response.data;
      }
    },
    staleTime: 1000 * 60 * 5,  // 5분
  });
}
