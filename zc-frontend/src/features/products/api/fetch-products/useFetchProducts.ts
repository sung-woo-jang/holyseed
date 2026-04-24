import { useQuery } from '@tanstack/react-query';
import { axiosInstance } from '@/shared/api/axios';
import { ZC_API } from '@/shared/api/endpoints';
import { type ProductListResponse, type ProductQueryParams } from '@/features/products/types';

export function useFetchProducts(params: ProductQueryParams) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: async () => {
      const response = await axiosInstance.post<ProductListResponse>(
        ZC_API.PRODUCT_LISTINGS.SEARCH,
        params
      );
      return response.data;
    },
  });
}
