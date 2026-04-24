import { useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '@/shared/api/axios';
import { ZC_API } from '@/shared/api/endpoints';
import type { UpdatePriceDto, ProductModel } from '../types';

export function useUpdatePrice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdatePriceDto }) => {
      const response = await axiosInstance.post<ProductModel>(
        ZC_API.PRODUCT_MODELS.UPDATE_PRICE(id),
        data
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['product-models'] });
      queryClient.invalidateQueries({ queryKey: ['product-models', variables.id] });
    },
  });
}
