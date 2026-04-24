import { useQuery } from '@tanstack/react-query';
import { axiosInstance } from '@/shared/api/axios';
import { ZC_API } from '@/shared/api/endpoints';
import type { StatsResponse } from '../types';

export function useFetchStats() {
  return useQuery({
    queryKey: ['stats', 'overview'],
    queryFn: async () => {
      const response = await axiosInstance.post<StatsResponse>(
        ZC_API.STATS.OVERVIEW
      );
      return response.data.data;
    },
    staleTime: 1000 * 60 * 2,  // 2분
  });
}
