import { useQuery } from '@tanstack/react-query';
import { axiosInstance } from '@/shared/api/axios';
import { ZC_API } from '@/shared/api/endpoints';
import { type Quote } from '@/features/quotes/types';

export function useFetchQuoteDetail(id: string) {
  return useQuery({
    queryKey: ['quote', id],
    queryFn: async () => {
      const response = await axiosInstance.get<Quote>(
        ZC_API.QUOTES.DETAIL(id)
      );
      return response.data;
    },
    enabled: !!id,
  });
}
