import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { errorMessage, post } from '@/api/client'
import { btnPrimary, btnGhost, inputCls } from '@/components/ui'
import { useAuthStore } from '@/stores/auth.store'

export default function OnboardingPage() {
  const qc = useQueryClient()
  const me = useAuthStore((s) => s.me)
  const clear = useAuthStore((s) => s.clear)
  const [mode, setMode] = useState<'create' | 'join'>('create')
  const [name, setName] = useState('우리 집')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    setBusy(true)
    setError('')
    try {
      if (mode === 'create') await post('/household/create', { name: name.trim() })
      else await post('/household/join', { code: code.trim().toUpperCase() })
      await qc.invalidateQueries({ queryKey: ['fridge'] })
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const ready = mode === 'create' ? name.trim().length > 0 : code.trim().length > 0

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 overflow-y-auto bg-bg px-6 py-10">
      <div className="text-center">
        <div className="text-[34px] font-bold">{me ? `${me.user.name}님, 반가워요` : '반가워요'}</div>
        <div className="mt-2 text-[20px] text-sub">함께 쓸 가구를 만들거나, 초대 코드로 들어오세요</div>
      </div>

      <div className="flex w-full max-w-md flex-col gap-4 rounded-3xl bg-card p-6">
        <div className="flex rounded-[14px] bg-bg p-1">
          {([['새 가구 만들기', 'create'], ['초대 코드로 참여', 'join']] as const).map(([label, v]) => (
            <button
              key={v}
              onClick={() => setMode(v)}
              className={`h-12 flex-1 rounded-[10px] text-[18px] font-semibold ${mode === v ? 'bg-line text-ink' : 'text-sub'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {mode === 'create' ? (
          <input
            className={inputCls}
            value={name}
            maxLength={30}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && ready && submit()}
            placeholder="가구 이름 (예: 우리 집)"
          />
        ) : (
          <input
            className={`${inputCls} tracking-widest uppercase`}
            value={code}
            maxLength={8}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && ready && submit()}
            placeholder="초대 코드 8자리"
            autoCapitalize="characters"
          />
        )}

        {error && <div className="text-[18px] text-coral">{error}</div>}

        <button className={btnPrimary} disabled={busy || !ready} onClick={submit}>
          {mode === 'create' ? '만들기' : '참여하기'}
        </button>
      </div>

      <button className={`${btnGhost} h-12 text-[18px]`} onClick={clear}>
        다른 계정으로 로그인
      </button>
    </div>
  )
}
