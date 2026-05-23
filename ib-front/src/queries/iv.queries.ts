import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  authApi,
  strategiesApi,
  plansApi,
  executionsApi,
  pricesApi,
  type FillRowInput,
} from '@/lib/iv-api'

// ─────────────────────────────────────────
// Keys
// ─────────────────────────────────────────
export const keys = {
  me: ['iv', 'me'] as const,
  strategies: ['strategies'] as const,
  strategy: (id: string) => ['strategies', id] as const,
  state: (id: string) => ['strategies', id, 'state'] as const,
  plan: (id: string) => ['strategies', id, 'plan'] as const,
  executions: (id: string) => ['strategies', id, 'executions'] as const,
  price: (ticker: string) => ['prices', ticker] as const,
}

// ─────────────────────────────────────────
// Queries
// ─────────────────────────────────────────
export const useMe = () =>
  useQuery({ queryKey: keys.me, queryFn: authApi.me, staleTime: 1000 * 60 * 5 })

export const useStrategies = () =>
  useQuery({ queryKey: keys.strategies, queryFn: strategiesApi.getAll, staleTime: 1000 * 60 })

export const useStrategy = (id: string) =>
  useQuery({ queryKey: keys.strategy(id), queryFn: () => strategiesApi.getOne(id), enabled: !!id })

export const useStrategyState = (id: string) =>
  useQuery({ queryKey: keys.state(id), queryFn: () => strategiesApi.getState(id), enabled: !!id, staleTime: 1000 * 30 })

export const useTodayPlan = (id: string) =>
  useQuery({ queryKey: keys.plan(id), queryFn: () => plansApi.getToday(id), enabled: !!id, staleTime: 1000 * 60 })

export const useExecutions = (id: string) =>
  useQuery({ queryKey: keys.executions(id), queryFn: () => executionsApi.getAll(id), enabled: !!id })

export const useLatestPrice = (ticker: string) =>
  useQuery({ queryKey: keys.price(ticker), queryFn: () => pricesApi.getLatest(ticker), staleTime: 1000 * 60 * 5 })

export const usePriceHistory = (ticker: string) =>
  useQuery({
    queryKey: ['prices', ticker, 'history'] as const,
    queryFn: () => pricesApi.getHistory(ticker),
    staleTime: 1000 * 60 * 5,
    enabled: !!ticker,
  })

// ─────────────────────────────────────────
// Mutations
// ─────────────────────────────────────────
export const useCreateStrategy = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: strategiesApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.strategies }),
  })
}

export const useDeleteStrategy = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => strategiesApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.strategies }),
  })
}

export const useCreateExecution = (strategyId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { execDate: string; rows: FillRowInput[] }) =>
      executionsApi.create(strategyId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.state(strategyId) })
      qc.invalidateQueries({ queryKey: keys.plan(strategyId) })
      qc.invalidateQueries({ queryKey: keys.executions(strategyId) })
    },
  })
}

export const useDeleteExecution = (strategyId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (execId: string) => executionsApi.deleteOne(strategyId, execId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.state(strategyId) })
      qc.invalidateQueries({ queryKey: keys.plan(strategyId) })
      qc.invalidateQueries({ queryKey: keys.executions(strategyId) })
    },
  })
}

export const useUpdateExecution = (strategyId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ execId, price, qty }: { execId: string; price: number; qty: number }) =>
      executionsApi.updateOne(strategyId, execId, { price, qty }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.state(strategyId) })
      qc.invalidateQueries({ queryKey: keys.plan(strategyId) })
      qc.invalidateQueries({ queryKey: keys.executions(strategyId) })
    },
  })
}

export const useRefreshPrice = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: pricesApi.refresh,
    onSuccess: (_, ticker) => {
      qc.invalidateQueries({ queryKey: keys.price(ticker) })
      qc.invalidateQueries({ queryKey: keys.strategies })
    },
  })
}

export const useUpdateNickname = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (nickname: string) => authApi.updateNickname(nickname),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.me }),
  })
}
