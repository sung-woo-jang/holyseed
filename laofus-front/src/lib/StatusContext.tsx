import { createContext, useContext, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { StatusDto } from './types'

export interface StatusContextValue {
  status: StatusDto | null
  connected: boolean
  /** 마지막 SSE 메시지(status/heartbeat) 수신 시각 (epoch ms) */
  lastMessageAt: number | null
}

const StatusContext = createContext<StatusContextValue | null>(null)

const STALE_MS = 45_000 // 백엔드 하트비트 30초 — 45초 무소식이면 연결 재생성

/**
 * 앱 전체가 공유하는 단일 SSE 연결.
 * EventSource 네이티브 재연결이 침묵(잠자기 복귀·프록시 끊김)에 빠지면
 * 스테일 감시가 연결을 강제로 다시 만든다.
 */
export function StatusProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<StatusDto | null>(null)
  const [connected, setConnected] = useState(false)
  const [lastMessageAt, setLastMessageAt] = useState<number | null>(null)
  const [retryNonce, setRetryNonce] = useState(0)
  const lastMsgRef = useRef<number>(Date.now())

  useEffect(() => {
    const es = new EventSource('/api/laofus/stream')
    const touch = () => {
      lastMsgRef.current = Date.now()
      setLastMessageAt(lastMsgRef.current)
      setConnected(true)
    }
    es.addEventListener('status', (e) => {
      setStatus(JSON.parse((e as MessageEvent).data))
      touch()
    })
    es.addEventListener('heartbeat', touch)
    es.onerror = () => setConnected(false)
    return () => es.close()
  }, [retryNonce])

  useEffect(() => {
    const id = setInterval(() => {
      if (Date.now() - lastMsgRef.current > STALE_MS) {
        setConnected(false)
        lastMsgRef.current = Date.now() // 재생성 직후 연쇄 재시도 방지
        setRetryNonce((v) => v + 1)
      }
    }, 5_000)
    return () => clearInterval(id)
  }, [])

  return <StatusContext.Provider value={{ status, connected, lastMessageAt }}>{children}</StatusContext.Provider>
}

export function useStatusContext(): StatusContextValue {
  const ctx = useContext(StatusContext)
  if (!ctx) throw new Error('useStatusContext는 StatusProvider 내부에서만 사용')
  return ctx
}
