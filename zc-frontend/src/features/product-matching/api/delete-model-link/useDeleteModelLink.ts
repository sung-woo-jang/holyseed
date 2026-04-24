import { useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '@/shared/api/axios';
import { ZC_API } from '@/shared/api/endpoints';

export function useDeleteModelLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (linkId: string) => {
      const response = await axiosInstance.post(
        ZC_API.PRODUCT_MODEL_LINKS.DELETE(linkId)
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-model-links'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
