import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { fmtUSD, fmtPct } from '@/lib/format'
import { cyclesApi } from '@/lib/iv-api'
import type { IvStrategy } from '@/lib/iv-api'
import { keys } from '@/queries/iv.queries'

interface Props {
  strategy: IvStrategy
  profit: number
  profitPct: number
  onClose: () => void
}

export function CycleEndOverlay({ strategy, profit, profitPct, onClose }: Props) {
  const qc = useQueryClient()
  const [mode, setMode] = useState<'compound' | 'simple'>('compound')

  const mutation = useMutation({
    mutationFn: () => cyclesApi.startNext(strategy.id, mode),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.strategies })
      qc.invalidateQueries({ queryKey: keys.state(strategy.id) })
      qc.invalidateQueries({ queryKey: keys.plan(strategy.id) })
      onClose()
    },
  })

  const isProfit = profit >= 0

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: 'var(--color-bg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
      }}
    >
      {/* 이모지 없이 텍스트로 표현 */}
      <div style={{ fontSize: 48, fontWeight: 800, marginBottom: 8, color: isProfit ? '#f04452' : '#2563eb' }}>
        {isProfit ? '+' : ''}
        {fmtPct(profitPct)}
      </div>

      <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>사이클 {strategy.cycleNo} 종료!</div>
      <div style={{ fontSize: 15, color: 'var(--color-text-secondary)', marginBottom: 32 }}>
        {strategy.ticker} · 수익금 {isProfit ? '+' : ''}
        {fmtUSD(profit)}
      </div>

      {/* 복리 / 단리 선택 */}
      <div style={{ width: '100%', marginBottom: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 10 }}>
          다음 사이클 원금 설정
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {(['compound', 'simple'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                flex: 1,
                padding: '14px',
                border: `2px solid ${mode === m ? 'var(--color-primary)' : 'var(--color-border)'}`,
                borderRadius: 14,
                background: mode === m ? 'var(--color-avg-bg)' : 'var(--color-card)',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                color: 'var(--color-text)',
              }}
            >
              {m === 'compound' ? '복리' : '단리'}
              <div style={{ fontSize: 11, fontWeight: 400, color: 'var(--color-text-secondary)', marginTop: 4 }}>
                {m === 'compound' ? '잔금을 새 원금으로' : '원금 그대로 유지'}
              </div>
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
        style={{
          width: '100%',
          padding: '16px',
          background: 'var(--color-primary)',
          color: '#fff',
          border: 'none',
          borderRadius: 14,
          fontSize: 17,
          fontWeight: 700,
          cursor: 'pointer',
          marginBottom: 12,
        }}
      >
        {mutation.isPending ? '처리 중...' : `사이클 ${strategy.cycleNo + 1} 시작`}
      </button>

      <button
        onClick={onClose}
        style={{
          width: '100%',
          padding: '14px',
          background: 'none',
          border: '1px solid var(--color-border)',
          borderRadius: 14,
          fontSize: 15,
          cursor: 'pointer',
          color: 'var(--color-text-secondary)',
        }}
      >
        나중에
      </button>
    </div>
  )
}
