import { axiosInstance, BACKTEST_API } from '@/shared/api'
import { useStandardMutation } from '@/shared/hooks/custom-query'
import type { GetPricesInput, PricePoint } from './types'

/** 백테스트용 일봉 종가 조회 — 서버가 캐시 없으면 토스 API로 채운 뒤 반환 (그래서 mutation으로 명시적 실행) */
export function useBacktestPrices() {
  return useStandardMutation<PricePoint[], Error, GetPricesInput>({
    mutationFn: async (input) => (await axiosInstance.post<PricePoint[]>(BACKTEST_API.PRICES, input)).data,
  })
}
