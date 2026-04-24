import { useQuery } from '@tanstack/react-query';
import { axiosInstance } from '@/shared/api/axios';
import { ZC_API } from '@/shared/api/endpoints';
import type { ProductModel } from '../types';

export function useFetchModelDetail(id: string) {
  return useQuery({
    queryKey: ['product-model', id],
    queryFn: async () => {
      const response = await axiosInstance.get<ProductModel>(
        ZC_API.PRODUCT_MODELS.DETAIL(id)
      );
      return response.data;
    },
    enabled: !!id,
  });
}
