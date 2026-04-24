import { useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '@/shared/api/axios';
import { ZC_API } from '@/shared/api/endpoints';
import type { CreateProductModelDto, ProductModel } from '../types';

export function useCreateProductModel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateProductModelDto) => {
      const response = await axiosInstance.post<ProductModel>(
        ZC_API.PRODUCT_MODELS.CREATE,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-models'] });
    },
  });
}
