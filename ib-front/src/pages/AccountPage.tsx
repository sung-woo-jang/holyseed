import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CycleEditSheet } from '@/components/sheet/CycleEditSheet'
import { TOKEN_KEY } from '@/lib/api'
import { fmtUSD } from '@/lib/format'
import type { IvStrategy } from '@/lib/iv-api'
import { useStrategies, useDeleteStrategy, useMe, useUpdateNickname } from '@/queries/iv.queries'

function useDarkMode() {
  const [isDark, setIsDark] = useState(() => {
    try {
      return localStorage.getItem('iv-dark') === '1'
    } catch {
      return false
    }
  })

  useEffect(() => {
    if (isDark) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
    try {
      localStorage.setItem('iv-dark', isDark ? '1' : '0')
    } catch {
      /* noop */
    }
  }, [isDark])

  return [isDark, setIsDark] as const
}

export function AccountPage() {
  const nav = useNavigate()
  const { data: strategies = [] } = useStrategies()
  const { data: user } = useMe()
  const deleteMutation = useDeleteStrategy()
  const nicknameMutation = useUpdateNickname()
  const [editTarget, setEditTarget] = useState<IvStrategy | null>(null)
  const [isDark, setIsDark] = useDarkMode()
  const [nicknameEdit, setNicknameEdit] = useState(false)
  const [nicknameInput, setNicknameInput] = useState('')

  const displayName = user ? (user.nickname ?? user.username) : '...'

  // 운용 일수: 가장 오래된 전략 createdAt 기준
  const oldestDate = strategies.reduce<Date | null>((acc, s) => {
    const d = new Date(s.createdAt)
    return acc === null || d < acc ? d : acc
  }, null)
  const operatingDays = oldestDate ? Math.floor((Date.now() - oldestDate.getTime()) / 86400000) : 0

  // 완료 사이클: 전략별 (cycleNo - 1) 합산
  const completedCycles = strategies.reduce((sum, s) => sum + Math.max(0, s.cycleNo - 1), 0)

  return (
    <div style={{ padding: 16, paddingBottom: 80 }}>
      <h2 style={{ fontWeight: 800, fontSize: 22, margin: '0 0 24px' }}>계정</h2>

      {/* 프로필 카드 */}
      <div className="card" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            background: 'var(--color-primary)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: 20,
            flexShrink: 0,
          }}
        >
          {displayName[0] ?? '?'}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{displayName}님</div>
          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
            무한매수법 V4.0 · {user?.username ?? ''}
          </div>
        </div>
      </div>

      {/* 운용 통계 */}
      {strategies.length > 0 && (
        <>
          <div style={{ fontSize: 13, color: 'var(--color-text)', fontWeight: 700, marginBottom: 8 }}>운용 현황</div>
          <div
            className="card"
            style={{
              marginBottom: 20,
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: 8,
            }}
          >
            {[
              { label: '운용 일수', value: `${operatingDays}일` },
              { label: '운용 전략', value: `${strategies.length}개` },
              { label: '완료 사이클', value: `${completedCycles}회` },
            ].map(({ label, value }) => (
              <div key={label} style={{ textAlign: 'center', padding: '8px 0' }}>
                <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 4 }}>{label}</div>
                <div style={{ fontWeight: 800, fontSize: 18 }}>{value}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* 전략 목록 */}
      <div style={{ fontSize: 13, color: 'var(--color-text)', fontWeight: 700, marginBottom: 8 }}>전략 운용</div>
      <div className="card" style={{ marginBottom: 20 }}>
        {strategies.length === 0 && (
          <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', margin: '16px 0' }}>
            전략이 없습니다.
          </p>
        )}
        {strategies.map((s, i) => (
          <div
            key={s.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 0',
              borderBottom: i < strategies.length - 1 ? '1px solid var(--color-border)' : 'none',
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{s.ticker}</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                사이클 {s.cycleNo} · {s.division}분할 · {fmtUSD(s.principal)}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setEditTarget(s)}
                style={{
                  background: 'none',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text)',
                  borderRadius: 10,
                  padding: '9px 16px',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                설정
              </button>
              <button
                onClick={() => {
                  if (confirm(`${s.ticker} 전략을 삭제할까요?`)) {
                    deleteMutation.mutate(s.id)
                  }
                }}
                style={{
                  background: 'none',
                  border: '1px solid #fca5a5',
                  color: '#ef4444',
                  borderRadius: 10,
                  padding: '9px 16px',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                삭제
              </button>
            </div>
          </div>
        ))}
        <button
          onClick={() => nav('/strategy/new')}
          style={{
            display: 'block',
            width: '100%',
            marginTop: 12,
            padding: '14px',
            background: 'var(--color-primary)',
            color: '#fff',
            border: 'none',
            borderRadius: 14,
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          + 전략 추가
        </button>
      </div>

      {/* 앱 설정 */}
      <div style={{ fontSize: 13, color: 'var(--color-text)', fontWeight: 700, marginBottom: 8 }}>앱 설정</div>
      <div className="card" style={{ marginBottom: 20 }}>
        {/* 별명 설정 */}
        <div
          style={{
            padding: '13px 0',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          {nicknameEdit ? (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                value={nicknameInput}
                onChange={(e) => setNicknameInput(e.target.value)}
                placeholder="별명 입력 (최대 50자)"
                maxLength={50}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  border: '1px solid var(--color-border)',
                  borderRadius: 8,
                  fontSize: 14,
                  background: 'var(--color-bg)',
                  color: 'var(--color-text)',
                }}
              />
              <button
                onClick={async () => {
                  if (!nicknameInput.trim()) return
                  await nicknameMutation.mutateAsync(nicknameInput.trim())
                  setNicknameEdit(false)
                  setNicknameInput('')
                }}
                disabled={nicknameMutation.isPending}
                style={{
                  padding: '8px 14px',
                  background: 'var(--color-primary)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                저장
              </button>
              <button
                onClick={() => {
                  setNicknameEdit(false)
                  setNicknameInput('')
                }}
                style={{
                  padding: '8px 10px',
                  background: 'none',
                  border: '1px solid var(--color-border)',
                  borderRadius: 8,
                  fontSize: 13,
                  cursor: 'pointer',
                  color: 'var(--color-text)',
                }}
              >
                취소
              </button>
            </div>
          ) : (
            <div
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
              onClick={() => {
                setNicknameEdit(true)
                setNicknameInput(user?.nickname ?? '')
              }}
            >
              <div>
                <span style={{ fontSize: 14 }}>별명 설정</span>
                <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                  {user?.nickname ? user.nickname : '미설정'}
                </div>
              </div>
              <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>수정 →</span>
            </div>
          )}
        </div>

        {/* 다크모드 토글 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '13px 0',
          }}
        >
          <span style={{ fontSize: 14 }}>다크 모드</span>
          <button
            onClick={() => setIsDark((v) => !v)}
            style={{
              width: 48,
              height: 26,
              borderRadius: 13,
              border: 'none',
              cursor: 'pointer',
              background: isDark ? 'var(--color-primary)' : 'var(--color-border)',
              position: 'relative',
              transition: 'background 0.2s',
            }}
          >
            <span
              style={{
                position: 'absolute',
                top: 3,
                left: isDark ? 25 : 3,
                width: 20,
                height: 20,
                borderRadius: 10,
                background: '#fff',
                transition: 'left 0.2s',
                display: 'block',
              }}
            />
          </button>
        </div>
      </div>

      {/* 로그아웃 */}
      <button
        onClick={() => {
          if (confirm('로그아웃 하시겠습니까?')) {
            localStorage.removeItem(TOKEN_KEY)
            window.location.href = '/login'
          }
        }}
        style={{
          display: 'block',
          width: '100%',
          padding: '14px',
          background: 'none',
          border: '1px solid #fca5a5',
          borderRadius: 12,
          fontSize: 14,
          fontWeight: 600,
          color: '#ef4444',
          cursor: 'pointer',
          marginBottom: 16,
        }}
      >
        로그아웃
      </button>

      {/* 버전 푸터 */}
      <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 8 }}>
        무한매수법 자동매매 v0.1.0 · 라오어 V4.0 기반
      </div>

      {/* CycleEditSheet */}
      {editTarget && <CycleEditSheet strategy={editTarget} onClose={() => setEditTarget(null)} />}
    </div>
  )
}
