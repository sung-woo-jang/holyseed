import { useQuery } from '@tanstack/react-query';
import { axiosInstance } from '@/shared/api/axios';
import { ZC_API } from '@/shared/api/endpoints';
import type { ProductListing } from '../types';

export function useFetchLinkedProducts(modelId: string) {
  return useQuery({
    queryKey: ['linked-products', modelId],
    queryFn: async () => {
      const response = await axiosInstance.get<ProductListing[]>(
        ZC_API.PRODUCT_MODELS.LINKED_PRODUCTS(modelId)
      );
      return response.data;
    },
    enabled: !!modelId,
  });
}
