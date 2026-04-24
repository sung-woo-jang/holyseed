import { useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '@/shared/api/axios';
import { ZC_API } from '@/shared/api/endpoints';
import { type CreateModelLinkDto } from '@/features/product-matching/types';

export function useCreateModelLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateModelLinkDto) => {
      const response = await axiosInstance.post(
        ZC_API.PRODUCT_MODEL_LINKS.CREATE,
        dto
      );
      return response.data;
    },
    onSuccess: () => {
      // 매칭 목록 및 제품 목록 새로고침
      queryClient.invalidateQueries({ queryKey: ['product-model-links'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
