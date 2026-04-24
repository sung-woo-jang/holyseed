import { useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '@/shared/api/axios';
import { ZC_API } from '@/shared/api/endpoints';
import { type CreateQuoteItemDto, type UpdateQuoteItemDto, type QuoteItem } from '@/features/quotes/types';

export function useAddQuoteItem(quoteId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateQuoteItemDto) => {
      const response = await axiosInstance.post<QuoteItem>(
        ZC_API.QUOTES.ITEMS.ADD(quoteId),
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quote', quoteId] });
    },
  });
}

export function useUpdateQuoteItem(quoteId: string, itemId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateQuoteItemDto) => {
      const response = await axiosInstance.post<QuoteItem>(
        ZC_API.QUOTES.ITEMS.UPDATE(quoteId, itemId),
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quote', quoteId] });
    },
  });
}

export function useDeleteQuoteItem(quoteId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemId: string) => {
      const response = await axiosInstance.post(
        ZC_API.QUOTES.ITEMS.DELETE(quoteId, itemId)
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quote', quoteId] });
    },
  });
}
