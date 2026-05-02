import { useQuery } from '@tanstack/react-query';
import { axiosInstance } from '@/shared/api/axios';
import { ZC_API } from '@/shared/api/endpoints';
import { type ModelCompareResponse } from '../types/product-model.types';

export function useFetchModelCompare(modelId: string) {
  return useQuery({
    queryKey: ['model-compare', modelId],
    queryFn: async () => {
      const response = await axiosInstance.get<ModelCompareResponse>(
        ZC_API.PRODUCT_MODELS.COMPARE(modelId),
      );
      return response.data;
    },
    enabled: !!modelId,
  });
}
