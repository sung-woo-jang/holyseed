import { useEffect, useState } from 'react'
import { useStatusContext } from './StatusContext'
import { api } from './types'

/** SSE 구독 훅 — StatusProvider의 단일 연결을 공유 (새로고침 없이 실시간 갱신) */
export function useStatus() {
  return useStatusContext()
}

/** 현재가 60초 폴링 훅 */
export function usePrice(): { price: number; ts: string } | null {
  const [price, setPrice] = useState<{ price: number; ts: string } | null>(null)
  useEffect(() => {
    let alive = true
    const tick = async () => {
      try {
        const p = await api<{ price: number; ts: string }>('/api/laofus/price')
        if (alive) setPrice(p)
      } catch {
        /* 무시 */
      }
    }
    tick()
    const id = setInterval(tick, 60_000)
    return () => {
      alive = false
      clearInterval(id)
    }
  }, [])
  return price
}
