import { useQuery } from '@tanstack/react-query';
import { axiosInstance } from '@/shared/api/axios';
import { ZC_API } from '@/shared/api/endpoints';
import { type Category } from '@/features/categories/types';

export function useFetchCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await axiosInstance.get<Category[]>(ZC_API.CATEGORIES.LIST);
      return response.data;
    },
  });
}
