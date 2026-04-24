import { useQuery } from '@tanstack/react-query';
import { axiosInstance } from '@/shared/api/axios';
import { ZC_API } from '@/shared/api/endpoints';
import type { Site } from '../../types';

export function useFetchSites() {
  return useQuery<Site[]>({
    queryKey: ['sites'],
    queryFn: async () => {
      const response = await axiosInstance.get<Site[]>(ZC_API.SITES.LIST);
      return response.data;
    },
    staleTime: 1000 * 60 * 10, // 10분
  });
}
