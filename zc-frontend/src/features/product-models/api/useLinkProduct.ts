import { useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '@/shared/api/axios';
import { ZC_API } from '@/shared/api/endpoints';
import type { LinkProductDto } from '../types';

export function useLinkProduct(modelId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: LinkProductDto) => {
      const response = await axiosInstance.post(
        ZC_API.PRODUCT_MODELS.LINK_PRODUCT(modelId),
        data
      );
      return response.data;
    },
    onSuccess: () => {
      // 연결된 제품 목록과 미매칭 제품 목록 갱신
      queryClient.invalidateQueries({ queryKey: ['product-models', modelId] });
      queryClient.invalidateQueries({ queryKey: ['unmatched-products'] });
      queryClient.invalidateQueries({ queryKey: ['linked-products', modelId] });
    },
  });
}
