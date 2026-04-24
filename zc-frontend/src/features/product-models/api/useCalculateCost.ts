import { useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '@/shared/api/axios';
import { ZC_API } from '@/shared/api/endpoints';
import type { ProductModel } from '../types';

export function useCalculateCost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (modelId: string) => {
      const response = await axiosInstance.post<ProductModel>(
        ZC_API.PRODUCT_MODELS.CALCULATE_COST(modelId)
      );
      return response.data;
    },
    onSuccess: (_, modelId) => {
      queryClient.invalidateQueries({ queryKey: ['product-models'] });
      queryClient.invalidateQueries({ queryKey: ['product-models', modelId] });
    },
  });
}
