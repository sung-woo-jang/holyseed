import { useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '@/shared/api/axios';
import { ZC_API } from '@/shared/api/endpoints';
import { type CreateQuoteDto, type Quote } from '@/features/quotes/types';

export function useCreateQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateQuoteDto) => {
      const response = await axiosInstance.post<Quote>(
        ZC_API.QUOTES.CREATE,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
    },
  });
}
