import { useQuery } from '@tanstack/react-query';
import { axiosInstance } from '@/shared/api/axios';
import { ZC_API } from '@/shared/api/endpoints';
import {
  type PriceHistoryItem,
  type PriceHistoryQueryParams,
} from '@/features/products/types';

export function useFetchPriceHistory(
  productId: string,
  params?: PriceHistoryQueryParams
) {
  return useQuery({
    queryKey: ['price-history', productId, params],
    queryFn: async () => {
      const response = await axiosInstance.post<PriceHistoryItem[]>(
        ZC_API.PRICE_HISTORY.SEARCH(productId),
        params || {}
      );
      return response.data;
    },
    enabled: !!productId,
  });
}
