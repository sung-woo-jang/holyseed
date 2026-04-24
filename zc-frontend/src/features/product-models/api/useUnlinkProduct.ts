import { useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '@/shared/api/axios';
import { ZC_API } from '@/shared/api/endpoints';

export function useUnlinkProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ modelId, listingId }: { modelId: string; listingId: string }) => {
      await axiosInstance.post(
        ZC_API.PRODUCT_MODELS.UNLINK_PRODUCT(modelId, listingId)
      );
    },
    onSuccess: (_, variables) => {
      // 연결된 제품 목록 갱신
      queryClient.invalidateQueries({ queryKey: ['linked-products', variables.modelId] });
      // 미매칭 제품 목록 갱신
      queryClient.invalidateQueries({ queryKey: ['unmatched-products'] });
      // 통계 갱신
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}
