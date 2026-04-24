import { useQuery } from '@tanstack/react-query';
import { axiosInstance } from '@/shared/api/axios';
import { ZC_API } from '@/shared/api/endpoints';
import { type ProductModelLink } from '@/features/product-matching/types';

export function useFetchModelLinks() {
  return useQuery({
    queryKey: ['product-model-links'],
    queryFn: async () => {
      const response = await axiosInstance.get<ProductModelLink[]>(
        ZC_API.PRODUCT_MODEL_LINKS.LIST
      );
      return response.data;
    },
  });
}
