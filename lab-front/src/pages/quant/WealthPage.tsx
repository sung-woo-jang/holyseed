import { useEffect, useState } from 'react'
import { Tile } from '@/features/quant/ui/ui'
import type { AccountDto, AccountSnapshotDto } from '@/features/quant/lib/types'
import { api, krw, n, usd } from '@/features/quant/lib/types'

function kstToday(): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(new Date())
}

export default function WealthPage() {
  const [account, setAccount] = useState<AccountDto | null>(null)
  const [snapshots, setSnapshots] = useState<AccountSnapshotDto[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [recording, setRecording] = useState(false)
  const [copied, setCopied] = useState(false)

  const loadAll = async () => {
    try {
      const [a, s] = await Promise.all([
        api<AccountDto>('/api/laofus/account'),
        api<AccountSnapshotDto[]>('/api/laofus/account-snapshots'),
      ])
      setAccount(a)
      setSnapshots(s)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  useEffect(() => {
    loadAll()
  }, [])

  async function recordToday() {
    setRecording(true)
    try {
      await api('/api/laofus/account-snapshot/run', { method: 'POST' })
      await loadAll()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setRecording(false)
    }
  }

  async function copyJson() {
    if (!snapshots) return
    const rows = snapshots.map((s) => ({
      date: s.date,
      value: n(s.totalValueKrw),
      totalValueUsd: n(s.totalValueUsd),
      fxRateToKRW: n(s.fxRate),
    }))
    await navigator.clipboard.writeText(JSON.stringify(rows, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (error)
    return (
      <main className="wrap">
        <p style={{ color: 'var(--status-critical)' }}>{error}</p>
      </main>
    )
  if (!account || !snapshots)
    return (
      <main className="wrap">
        <p style={{ color: 'var(--text-muted)' }}>불러오는 중… (토스 API 조회)</p>
      </main>
    )

  const fx = account.exchangeRate ? n(account.exchangeRate.rate) : null
  const stockValueUsd = account.holdings.items.reduce((a, h) => a + n(h.marketValue.amount), 0)
  const cashUsd = n(account.buyingPower.usd)
  const cashKrw = n(account.buyingPower.krw)
  const totalValueUsd = stockValueUsd + cashUsd
  const totalValueKrw = fx ? totalValueUsd * fx + cashKrw : null

  const todayStr = kstToday()
  const sorted = [...snapshots].reverse() // 최신순
  const latest = sorted[0]
  const alreadyRecordedToday = latest?.date === todayStr

  return (
    <main className="wrap">
      <h1 style={{ fontSize: 18, marginBottom: 12 }}>실계좌 — 자산 기록</h1>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
        라오어(SOXL)+VR(TQQQ)이 공유하는 토스증권 계좌의 총자산(주식 평가금 + 예수금). 매일 06:00 KST에 자동 기록되며,
        아래 버튼으로 지금 즉시 다시 기록할 수도 있습니다.
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: 10,
          marginBottom: 16,
        }}
      >
        <Tile label="총자산 (실시간)" value={totalValueKrw !== null ? krw(totalValueKrw) : '—'} sub={usd(totalValueUsd)} />
        <Tile label="주식 평가금" value={usd(stockValueUsd)} />
        <Tile label="예수금 USD" value={usd(cashUsd)} />
        <Tile label="예수금 KRW" value={krw(cashKrw)} />
      </div>

      <div className="card" style={{ marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center' }}>
        <button onClick={recordToday} disabled={recording}>
          {recording ? '기록 중…' : alreadyRecordedToday ? '오늘 스냅샷 다시 기록' : '오늘 스냅샷 기록'}
        </button>
        {alreadyRecordedToday && (
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            오늘({todayStr}) 이미 기록됨 — 다시 누르면 최신 값으로 덮어씁니다
          </span>
        )}
        <div style={{ marginLeft: 'auto' }}>
          <button onClick={copyJson} disabled={snapshots.length === 0}>
            {copied ? '복사됨!' : 'JSON 복사 (자산일기용)'}
          </button>
        </div>
      </div>

      <div className="card">
        <h2 style={{ fontSize: 15, marginBottom: 8 }}>일별 기록 ({sorted.length}건)</h2>
        {sorted.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>아직 기록 없음 — 위 버튼으로 오늘자를 기록해보세요</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th className="l">날짜</th>
                  <th>총자산 KRW</th>
                  <th>총자산 USD</th>
                  <th>전일 대비</th>
                  <th>환율</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((s, i) => {
                  const prev = sorted[i + 1]
                  const delta = prev ? n(s.totalValueKrw) - n(prev.totalValueKrw) : null
                  return (
                    <tr key={s.id}>
                      <td className="l">{s.date}</td>
                      <td>{krw(n(s.totalValueKrw))}</td>
                      <td>{usd(n(s.totalValueUsd))}</td>
                      <td style={{ color: delta === null ? undefined : delta >= 0 ? 'var(--delta-good)' : 'var(--status-critical)' }}>
                        {delta === null ? '—' : `${delta >= 0 ? '+' : ''}${krw(delta)}`}
                      </td>
                      <td>₩{n(s.fxRate).toLocaleString()}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  )
}
