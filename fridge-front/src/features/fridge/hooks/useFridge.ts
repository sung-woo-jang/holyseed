import { useCallback, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { errorMessage, get, post } from '@/api/client'
import type { FridgeEvent, FridgeState, FreqItem, Ingredient, NightMode, Person, Place, Repeat, ShopItem } from '@/api/types'
import { useUiStore } from '@/stores/ui.store'

const STATE_KEY = ['fridge', 'state'] as const

export function useFridgeState() {
  return useQuery({
    queryKey: STATE_KEY,
    queryFn: () => get<FridgeState>('/state'),
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })
}

export interface EventInput {
  date: string
  time: string
  title: string
  personId: number | null
  repeat: Repeat
}
export interface IngredientInput {
  name: string
  place: Place
  exp: string
}

export function useFridgeActions() {
  const qc = useQueryClient()
  const toast = useUiStore((s) => s.showToast)

  const refresh = useCallback(() => qc.invalidateQueries({ queryKey: STATE_KEY }), [qc])
  const refreshAll = useCallback(() => qc.invalidateQueries({ queryKey: ['fridge'] }), [qc])

  // 서버 호출 → 성공 시 상태 갱신. 실패하면 토스트로 사유를 보여주고 undefined 반환
  const run = useCallback(
    async <T,>(fn: () => Promise<T>, okMsg?: string | ((r: T) => string)): Promise<T | undefined> => {
      try {
        const r = await fn()
        await refresh()
        if (okMsg) toast(typeof okMsg === 'function' ? okMsg(r) : okMsg)
        return r
      } catch (e) {
        toast(errorMessage(e))
        await refresh()
        return undefined
      }
    },
    [refresh, toast],
  )

  return useMemo(
    () => ({
      refresh,
      createEvent: (b: EventInput, msg: string) => run(() => post<FridgeEvent>('/events/create', b), msg),
      updateEvent: (id: number, b: EventInput) => run(() => post<FridgeEvent>(`/events/${id}/update`, b), '일정을 고쳤어요'),
      deleteEvent: (id: number) => run(() => post(`/events/${id}/delete`), '일정을 지웠어요'),

      createIngredient: (b: IngredientInput, msg: string) => run(() => post<Ingredient>('/ingredients/create', b), msg),
      updateIngredient: (id: number, b: IngredientInput, msg: string) => run(() => post<Ingredient>(`/ingredients/${id}/update`, b), msg),
      deleteIngredient: (id: number, msg: string) => run(() => post(`/ingredients/${id}/delete`), msg),
      finishIngredient: (id: number) =>
        run(
          () => post<{ name: string; addedToShop: boolean }>(`/ingredients/${id}/finish`),
          (r) => (r.addedToShop ? `${r.name} 장보기에 담았어요` : `${r.name} 다 먹었어요`),
        ),

      createShop: (name: string) => run(() => post<ShopItem>('/shop/create', { name }), `${name} 담았어요`),
      deleteShop: (id: number) => run(() => post(`/shop/${id}/delete`)),
      stockShop: () => run(() => post<{ count: number }>('/shop/stock'), (r) => `${r.count}개 냉장고에 넣었어요`),
      clearDoneShop: () => run(() => post<{ count: number }>('/shop/clear-done')),
      toggleShop: async (id: number, done: boolean) => {
        qc.setQueryData<FridgeState>(STATE_KEY, (old) =>
          old ? { ...old, shop: old.shop.map((x) => (x.id === id ? { ...x, done } : x)) } : old,
        )
        try {
          await post(`/shop/${id}/update`, { done })
        } catch (e) {
          toast(errorMessage(e))
        }
        await refresh()
      },

      createFreq: (b: { name: string; place: Place; days: number }) => run(() => post<FreqItem>('/freq/create', b)),
      updateFreq: (id: number, b: Partial<{ place: Place; days: number }>) => run(() => post<FreqItem>(`/freq/${id}/update`, b)),
      deleteFreq: (id: number) => run(() => post(`/freq/${id}/delete`)),

      createPerson: (b: { name: string; color: string }) => run(() => post<Person>('/people/create', b), `${b.name} 추가했어요`),
      deletePerson: (id: number) => run(() => post(`/people/${id}/delete`)),

      updateHousehold: async (b: { name?: string; nightMode?: NightMode; defaultDays?: number }) => {
        try {
          await post('/household/update', b)
          await refreshAll()
        } catch (e) {
          toast(errorMessage(e))
        }
      },
      resetSample: () => run(() => post('/sample/reset'), '처음 상태로 되돌렸어요'),
    }),
    [qc, run, refresh, refreshAll, toast],
  )
}
