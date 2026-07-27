import { useQueryClient } from '@tanstack/react-query'
import { axiosInstance, VR_API } from '@/shared/api'
import { useStandardQuery, useStandardMutation } from '@/shared/hooks/custom-query'
import type {
  CreateCycleInput,
  CreateFillInput,
  VrCandle,
  VrCandleRange,
  VrCycle,
  VrFill,
  VrState,
  VrStatusDto,
} from './types'

const KEYS = {
  state: ['vr', 'state'],
  status: ['vr', 'status'],
  fills: ['vr', 'fills'],
  cycles: ['vr', 'cycles'],
  candles: (range: VrCandleRange) => ['vr', 'candles', range],
}

const invalidateAll = (qc: ReturnType<typeof useQueryClient>) => {
  qc.invalidateQueries({ queryKey: ['vr'] })
}

export function useVrState() {
  return useStandardQuery<VrState>({
    queryKey: KEYS.state,
    queryFn: async () => (await axiosInstance.get<VrState>(VR_API.STATE)).data,
  })
}

/** 엔진 상태(mode/스케줄러/다음실행/활성세션/이벤트) — 10초 폴링 (VR은 매시 1회 판단이라 SSE 불필요) */
export function useVrStatus() {
  return useStandardQuery<VrStatusDto>({
    queryKey: KEYS.status,
    queryFn: async () => (await axiosInstance.get<VrStatusDto>(VR_API.STATUS)).data,
    refetchInterval: 10_000,
  })
}

export function useVrFills() {
  return useStandardQuery<VrFill[]>({
    queryKey: KEYS.fills,
    queryFn: async () => (await axiosInstance.get<VrFill[]>(VR_API.FILLS)).data,
  })
}

export function useVrCycles() {
  return useStandardQuery<VrCycle[]>({
    queryKey: KEYS.cycles,
    queryFn: async () => (await axiosInstance.get<VrCycle[]>(VR_API.CYCLES)).data,
  })
}

/** TQQQ 캔들 (range별 5분 서버 캐시) */
export function useVrCandles(range: VrCandleRange) {
  return useStandardQuery<VrCandle[]>({
    queryKey: KEYS.candles(range),
    queryFn: async () => (await axiosInstance.get<VrCandle[]>(VR_API.CANDLES, { params: { range } })).data,
  })
}

/** 엔진 수동 실행 (항상 dry-run — live 파라미터 없음) */
export function useRunVrEngine() {
  const qc = useQueryClient()
  return useStandardMutation<{ lines: string[] }, Error, void>({
    mutationFn: async () => (await axiosInstance.post<{ lines: string[] }>(VR_API.RUN, { live: false })).data,
    onSuccess: () => invalidateAll(qc),
  })
}

export function useCreateFill() {
  const qc = useQueryClient()
  return useStandardMutation<VrFill, Error, CreateFillInput>({
    mutationFn: async (input) => (await axiosInstance.post<VrFill>(VR_API.FILLS, input)).data,
    onSuccess: () => invalidateAll(qc),
  })
}

export function useDeleteFill() {
  const qc = useQueryClient()
  return useStandardMutation<null, Error, number>({
    mutationFn: async (id) => (await axiosInstance.post<null>(VR_API.FILL_DELETE(id))).data,
    onSuccess: () => invalidateAll(qc),
  })
}

export function useCreateCycle() {
  const qc = useQueryClient()
  return useStandardMutation<VrCycle, Error, CreateCycleInput>({
    mutationFn: async (input) => (await axiosInstance.post<VrCycle>(VR_API.CYCLES, input)).data,
    onSuccess: () => invalidateAll(qc),
  })
}

export function useRollover() {
  const qc = useQueryClient()
  return useStandardMutation<{ closedCycle: VrCycle; newCycle: VrCycle }, Error, { newStartDate?: string }>({
    mutationFn: async (input) => (await axiosInstance.post<{ closedCycle: VrCycle; newCycle: VrCycle }>(VR_API.ROLLOVER, input)).data,
    onSuccess: () => invalidateAll(qc),
  })
}
