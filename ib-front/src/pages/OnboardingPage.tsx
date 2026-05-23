import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCreateStrategy } from '@/queries/iv.queries'

const STEPS = ['종목', '분할수', '원금', '확인']
const INCREMENTS = [50, 100, 500, 1000]

export function OnboardingPage() {
  const nav = useNavigate()
  const [step, setStep] = useState(0)
  const [ticker, setTicker] = useState<'TQQQ' | 'SOXL'>('TQQQ')
  const [division, setDivision] = useState<20 | 40>(40)
  const [principal, setPrincipal] = useState(0)
  const createMutation = useCreateStrategy()

  const onceAmount = principal / division

  async function handleSubmit() {
    await createMutation.mutateAsync({ strategyType: 'infinite', ticker, principal, division })
    nav('/dashboard')
  }

  return (
    <div style={{ padding: 16, minHeight: '100vh', background: 'var(--color-bg)' }}>
      {/* 상단 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button
          onClick={() => (step > 0 ? setStep(step - 1) : nav(-1))}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20 }}
        >
          ←
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {STEPS.map((_, i) => (
              <div
                key={i}
                style={{
                  flex: 1, height: 3, borderRadius: 2,
                  background: i <= step ? 'var(--color-primary)' : 'var(--color-border)',
                }}
              />
            ))}
          </div>
          <div style={{ marginTop: 4, fontSize: 12, color: 'var(--color-text-secondary)' }}>
            {step + 1} / {STEPS.length}
          </div>
        </div>
      </div>

      {/* Step 0: 종목 */}
      {step === 0 && (
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>종목 선택</h2>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 24 }}>
            무한매수법을 운용할 ETF를 선택하세요.
          </p>
          {(['TQQQ', 'SOXL'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTicker(t)}
              style={{
                display: 'block', width: '100%', marginBottom: 12, padding: '16px',
                border: `2px solid ${ticker === t ? 'var(--color-primary)' : 'var(--color-border)'}`,
                borderRadius: 14, background: ticker === t ? 'var(--color-avg-bg)' : 'var(--color-card)',
                fontSize: 18, fontWeight: 700, cursor: 'pointer', textAlign: 'left',
                color: 'var(--color-text)',
              }}
            >
              {t}
              <span style={{ marginLeft: 8, fontSize: 13, color: 'var(--color-text-secondary)', fontWeight: 400 }}>
                {t === 'TQQQ' ? 'ProShares Ultra QQQ 3× (나스닥)' : 'Direxion SOXL 3× (반도체)'}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Step 1: 분할수 */}
      {step === 1 && (
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>분할수</h2>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 24 }}>
            원금을 몇 회로 나눠 매수할지 설정합니다. 높을수록 안정적입니다.
          </p>
          {([20, 40] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDivision(d)}
              style={{
                display: 'block', width: '100%', marginBottom: 12, padding: '16px',
                border: `2px solid ${division === d ? 'var(--color-primary)' : 'var(--color-border)'}`,
                borderRadius: 14, background: division === d ? 'var(--color-avg-bg)' : 'var(--color-card)',
                fontSize: 18, fontWeight: 700, cursor: 'pointer', textAlign: 'left',
                color: 'var(--color-text)',
              }}
            >
              {d}분할
              <span style={{ marginLeft: 8, fontSize: 13, color: 'var(--color-text-secondary)', fontWeight: 400 }}>
                {d === 20 ? '공격적 · 진입 빠름' : '안정적 · 권장'}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Step 2: 원금 */}
      {step === 2 && (
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>원금 (USD)</h2>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 16 }}>
            투입할 총 달러 금액을 입력하세요.
          </p>
          <input
            type="number"
            inputMode="decimal"
            value={principal}
            onChange={(e) => setPrincipal(parseFloat(e.target.value) || 0)}
            style={{
              width: '100%', padding: '14px', fontSize: 20, fontWeight: 700,
              border: '2px solid var(--color-border)', borderRadius: 14,
              outline: 'none', marginBottom: 16,
              background: 'var(--color-card)', color: 'var(--color-text)',
            }}
          />
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {INCREMENTS.map((n) => (
              <button
                key={n}
                onClick={() => setPrincipal((v) => v + n)}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 10,
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-card)', color: 'var(--color-text)',
                  cursor: 'pointer', fontWeight: 600, fontSize: 14,
                }}
              >
                +{n}
              </button>
            ))}
          </div>
          <div style={{ padding: '12px', background: 'var(--color-bg)', borderRadius: 12, fontSize: 14 }}>
            1회 매수액: <strong>${onceAmount.toFixed(2)}</strong>
          </div>
        </div>
      )}

      {/* Step 3: 확인 */}
      {step === 3 && (
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>설정 확인</h2>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 24 }}>
            아래 내용으로 전략을 시작합니다.
          </p>
          <div className="card" style={{ marginBottom: 16 }}>
            {[
              { label: '종목', value: ticker },
              { label: '분할수', value: `${division}분할` },
              { label: '원금', value: `$${principal.toLocaleString()}` },
              { label: '1회 매수액', value: `$${onceAmount.toFixed(2)}` },
              { label: '시작 모드', value: '사이클 시작 (T=0)' },
            ].map(({ label, value }) => (
              <div
                key={label}
                style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--color-border)' }}
              >
                <span style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
                <span style={{ fontWeight: 600 }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 하단 버튼 */}
      <div style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', width: 'calc(100% - 32px)', maxWidth: 448 }}>
        {(() => {
          const needsPrincipal = step >= 2 && principal <= 0
          const isDisabled = createMutation.isPending || needsPrincipal
          return (
            <button
              onClick={step < STEPS.length - 1 ? () => setStep(step + 1) : handleSubmit}
              disabled={isDisabled}
              style={{
                width: '100%', padding: '16px',
                background: isDisabled ? 'var(--color-border)' : 'var(--color-primary)',
                color: isDisabled ? 'var(--color-text-secondary)' : '#fff',
                border: 'none', borderRadius: 14,
                fontSize: 17, fontWeight: 600,
                cursor: isDisabled ? 'default' : 'pointer',
              }}
            >
              {step < STEPS.length - 1 ? '다음' : createMutation.isPending ? '생성 중...' : '시작하기'}
            </button>
          )
        })()}
      </div>
    </div>
  )
}
