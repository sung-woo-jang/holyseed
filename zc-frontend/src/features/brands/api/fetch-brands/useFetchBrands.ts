import { useQuery } from '@tanstack/react-query';
import { axiosInstance } from '@/shared/api/axios';
import { ZC_API } from '@/shared/api/endpoints';
import { type Brand } from '@/features/brands/types';

export function useFetchBrands() {
  return useQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      const response = await axiosInstance.get<Brand[]>(ZC_API.BRANDS.LIST);
      return response.data;
    },
  });
}
