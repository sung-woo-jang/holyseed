import { useQuery } from '@tanstack/react-query';
import { axiosInstance } from '@/shared/api/axios';
import { ZC_API } from '@/shared/api/endpoints';
import { type UnifiedCategory } from '@/features/categories/types';

export function useFetchUnifiedTree() {
  return useQuery({
    queryKey: ['unified-categories', 'tree'],
    queryFn: async () => {
      const response = await axiosInstance.get<UnifiedCategory[]>(ZC_API.CATEGORIES.TREE);
      return response.data;
    },
  });
}
