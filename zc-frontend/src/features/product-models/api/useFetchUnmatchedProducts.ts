import { useQuery } from '@tanstack/react-query';
import { axiosInstance } from '@/shared/api/axios';
import { ZC_API } from '@/shared/api/endpoints';
import type { ProductListingQueryParams, ProductListingListResponse } from '../types';

export function useFetchUnmatchedProducts(params: ProductListingQueryParams = {}) {
  return useQuery({
    queryKey: ['unmatched-products', params],
    queryFn: async () => {
      const response = await axiosInstance.post<ProductListingListResponse>(
        ZC_API.PRODUCT_LISTINGS.UNMATCHED,
        {
          page: params.page || 1,
          limit: params.limit || 20,
          search: params.search,
          brandId: params.brandId,
        }
      );
      return response.data;
    },
    staleTime: 1000 * 60 * 2,  // 2분
  });
}
