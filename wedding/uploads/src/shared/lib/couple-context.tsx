'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Couple } from '@/shared/types'
import { api } from '@/shared/api'

interface CoupleContextValue {
  couple: Couple | null
  isLoading: boolean
  error: string | null
}

const CoupleContext = createContext<CoupleContextValue>({
  couple: null,
  isLoading: true,
  error: null,
})

export function CoupleProvider({ slug, children }: { slug: string; children: ReactNode }) {
  const [couple, setCouple] = useState<Couple | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    api
      .post('/couples/by-slug', { slug })
      .then((res) => {
        if (!cancelled) setCouple(res.data.data)
      })
      .catch(() => {
        if (!cancelled) setError('청첩장을 찾을 수 없습니다.')
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => { cancelled = true }
  }, [slug])

  return <CoupleContext.Provider value={{ couple, isLoading, error }}>{children}</CoupleContext.Provider>
}

export function useCouple() {
  return useContext(CoupleContext)
}
