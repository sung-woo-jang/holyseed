import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Tile } from '@/features/quant/ui/ui'
import type { AccountDto, AccountSnapshotDto } from '@/features/quant/lib/types'
import { api, krw, n, usd } from '@/features/quant/lib/types'

const LAST_COPY_KEY = 'vr-wealth-last-copy-date'

function kstToday(): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(new Date())
}

function shiftDate(date: string, deltaDays: number): string {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + deltaDays)
  return d.toISOString().slice(0, 10)
}

function toClipboardRows(rows: AccountSnapshotDto[]) {
  return rows.map((s) => ({
    date: s.date,
    value: n(s.totalValueKrw),
    totalValueUsd: n(s.totalValueUsd),
    fxRateToKRW: n(s.fxRate),
  }))
}

export default function WealthPage() {
  const [account, setAccount] = useState<AccountDto | null>(null)
  const [snapshots, setSnapshots] = useState<AccountSnapshotDto[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [recording, setRecording] = useState(false)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [lastCopy, setLastCopy] = useState<string | null>(() => localStorage.getItem(LAST_COPY_KEY))

  const loadAll = async () => {
    try {
      const [a, s] = await Promise.all([
        api<AccountDto>('/api/laofus/account'),
        api<AccountSnapshotDto[]>('/api/laofus/account-snapshots'),
      ])
      setAccount(a)
      setSnapshots(s)
      setError(null)
      if (s.length > 0) {
        setFromDate((prev) => prev || s[0].date)
        setToDate((prev) => prev || s[s.length - 1].date)
      }
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

  const rangeRows = useMemo(() => {
    if (!snapshots) return []
    return snapshots.filter((s) => (!fromDate || s.date >= fromDate) && (!toDate || s.date <= toDate))
  }, [snapshots, fromDate, toDate])

  async function copyRange() {
    if (rangeRows.length === 0) {
      toast.error('선택한 범위에 기록이 없습니다.')
      return
    }
    await navigator.clipboard.writeText(JSON.stringify(toClipboardRows(rangeRows), null, 2))
    if (toDate) {
      localStorage.setItem(LAST_COPY_KEY, toDate)
      setLastCopy(toDate)
    }
    toast.success(`${rangeRows.length}건 복사됨 (${fromDate} ~ ${toDate})`)
  }

  async function copyOne(s: AccountSnapshotDto) {
    await navigator.clipboard.writeText(JSON.stringify(toClipboardRows([s]), null, 2))
    localStorage.setItem(LAST_COPY_KEY, s.date)
    setLastCopy(s.date)
    toast.success(`${s.date} 복사됨`)
  }

  function applyPreset(preset: 'all' | '7d' | '30d' | 'since-last') {
    if (!snapshots || snapshots.length === 0) return
    const latest = snapshots[snapshots.length - 1].date
    const earliest = snapshots[0].date
    if (preset === 'all') {
      setFromDate(earliest)
      setToDate(latest)
    } else if (preset === '7d') {
      setFromDate(shiftDate(latest, -6))
      setToDate(latest)
    } else if (preset === '30d') {
      setFromDate(shiftDate(latest, -29))
      setToDate(latest)
    } else {
      setFromDate(lastCopy ? shiftDate(lastCopy, 1) : earliest)
      setToDate(latest)
    }
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

  const presetBtnStyle = { fontSize: 12, padding: '4px 10px' }

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
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 15, marginBottom: 8 }}>JSON 복사 (자산일기용)</h2>
        <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
          <button style={presetBtnStyle} onClick={() => applyPreset('all')}>
            전체
          </button>
          <button style={presetBtnStyle} onClick={() => applyPreset('7d')}>
            최근 7일
          </button>
          <button style={presetBtnStyle} onClick={() => applyPreset('30d')}>
            최근 30일
          </button>
          {lastCopy && (
            <button style={presetBtnStyle} onClick={() => applyPreset('since-last')}>
              지난 복사 이후
            </button>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            From
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            To
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </label>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{rangeRows.length}건 복사됩니다</span>
          <div style={{ marginLeft: 'auto' }}>
            <button onClick={copyRange} disabled={rangeRows.length === 0}>
              JSON 복사
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 style={{ fontSize: 15, marginBottom: 8 }}>일별 기록 ({sorted.length}건)</h2>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>행을 클릭하면 그 날짜만 바로 복사됩니다.</p>
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
                    <tr
                      key={s.id}
                      onClick={() => copyOne(s)}
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-2, rgba(128,128,128,0.08))')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      title="클릭하여 이 날짜만 복사"
                    >
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
