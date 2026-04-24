import { useQuery } from '@tanstack/react-query';
import { axiosInstance } from '@/shared/api/axios';
import { ZC_API } from '@/shared/api/endpoints';
import { type Product } from '@/features/products/types';

export function useFetchProductDetail(id: string) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const response = await axiosInstance.get<Product>(
        ZC_API.PRODUCT_LISTINGS.DETAIL(id)
      );
      return response.data;
    },
    enabled: !!id,
  });
}
