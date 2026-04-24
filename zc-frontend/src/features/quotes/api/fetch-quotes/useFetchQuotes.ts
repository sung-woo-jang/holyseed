import { useQuery } from '@tanstack/react-query';
import { axiosInstance } from '@/shared/api/axios';
import { ZC_API } from '@/shared/api/endpoints';
import { type QuoteListResponse, type QuoteQueryParams } from '@/features/quotes/types';

export function useFetchQuotes(params: QuoteQueryParams = {}) {
  return useQuery({
    queryKey: ['quotes', params],
    queryFn: async () => {
      const response = await axiosInstance.post<QuoteListResponse>(
        ZC_API.QUOTES.SEARCH,
        params
      );
      return response.data;
    },
  });
}
