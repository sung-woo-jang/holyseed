import { useQuery } from '@tanstack/react-query';
import { axiosInstance } from '@/shared/api/axios';
import { ZC_API } from '@/shared/api/endpoints';
import type { ModelLinkSearchParams, ModelLinkSearchResponse } from '@/features/product-matching/types';

export function useFetchModelLinksSearch(params: ModelLinkSearchParams) {
  return useQuery({
    queryKey: ['product-model-links', 'search', params],
    queryFn: async () => {
      const response = await axiosInstance.post<ModelLinkSearchResponse>(
        ZC_API.PRODUCT_MODEL_LINKS.SEARCH,
        params,
      );
      return response.data;
    },
  });
}
