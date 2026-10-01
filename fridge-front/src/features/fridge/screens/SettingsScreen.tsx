import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { HouseholdMemberView } from '@/api/types'
import { errorMessage, get, post } from '@/api/client'
import { Seg, btnDanger, btnGhost, btnPrimary, inputCls } from '@/components/ui'
import { useAuthStore } from '@/stores/auth.store'
import { useUiStore } from '@/stores/ui.store'
import { PERSON_PALETTE } from '../lib/palette'
import { useFridgeActions } from '../hooks/useFridge'
import { useFridgeCtx } from '../layout/context'

function Card({ title, sub, children }: { title: string; sub?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3.5 rounded-[20px] bg-card p-5 lg:p-6">
      <div>
        <div className="text-[24px] font-bold">{title}</div>
        {sub && <div className="mt-0.5 text-[17px] text-sub">{sub}</div>}
      </div>
      {children}
    </section>
  )
}

export default function SettingsScreen() {
  const { state } = useFridgeCtx()
  const actions = useFridgeActions()
  const toast = useUiStore((s) => s.showToast)
  const qc = useQueryClient()
  const me = useAuthStore((s) => s.me)
  const clearAuth = useAuthStore((s) => s.clear)
  const isOwner = me?.household?.role === 'OWNER'

  const [pName, setPName] = useState('')
  const [pColor, setPColor] = useState(PERSON_PALETTE[1])
  const [confirmReset, setConfirmReset] = useState(false)
  const [invite, setInvite] = useState<{ code: string; expiresAt: string } | null>(null)
  const [confirmLeave, setConfirmLeave] = useState(false)
  const resetTimer = useRef<number>(undefined)
  useEffect(() => () => window.clearTimeout(resetTimer.current), [])

  const members = useQuery({
    queryKey: ['fridge', 'members'],
    queryFn: () => get<HouseholdMemberView[]>('/household/members'),
  })

  const used = new Set(state.people.map((p) => p.color))

  const addPerson = async () => {
    const name = pName.trim()
    if (!name) return
    setPName('')
    await actions.createPerson({ name, color: pColor })
    const next = PERSON_PALETTE.find((c) => !used.has(c) && c !== pColor)
    if (next) setPColor(next)
  }

  const onReset = async () => {
    if (!confirmReset) {
      setConfirmReset(true)
      resetTimer.current = window.setTimeout(() => setConfirmReset(false), 3000)
      return
    }
    window.clearTimeout(resetTimer.current)
    setConfirmReset(false)
    await actions.resetSample()
  }

  const issueInvite = async () => {
    try {
      setInvite(await post<{ code: string; expiresAt: string }>('/household/invite'))
    } catch (e) {
      toast(errorMessage(e))
    }
  }

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast('복사했어요')
    } catch {
      toast('복사하지 못했어요 — 코드를 직접 적어주세요')
    }
  }

  const removeMember = async (m: HouseholdMemberView) => {
    try {
      await post(`/household/members/${m.userId}/remove`)
      toast(`${m.name}님을 내보냈어요`)
      await qc.invalidateQueries({ queryKey: ['fridge', 'members'] })
    } catch (e) {
      toast(errorMessage(e))
    }
  }

  const leave = async () => {
    if (!confirmLeave) {
      setConfirmLeave(true)
      window.setTimeout(() => setConfirmLeave(false), 3000)
      return
    }
    try {
      await post('/household/leave')
      await qc.invalidateQueries({ queryKey: ['fridge'] })
    } catch (e) {
      toast(errorMessage(e))
      setConfirmLeave(false)
    }
  }

  const logout = () => {
    clearAuth()
    qc.clear()
  }

  const stepBtn = 'size-12 rounded-xl bg-chip text-[24px]'
  const days = state.settings.defaultDays

  return (
    <div className="flex flex-col gap-3.5 lg:min-h-0 lg:flex-1">
      <div className="text-[34px] font-bold lg:text-[40px]">설정</div>
      <div className="grid gap-3.5 lg:min-h-0 lg:flex-1 lg:grid-cols-2 lg:content-start lg:overflow-y-auto">
        <div className="flex flex-col gap-3.5">
          <Card title="함께 쓰는 사람" sub="일정에 '누구 일정인지' 색으로 표시해요 (로그인과는 별개예요)">
            <div className="flex flex-col gap-1.5">
              {state.people.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3 rounded-[14px] bg-card2 py-2 pl-[18px] pr-2">
                  <span className="size-4 shrink-0 rounded-full" style={{ background: p.color }} />
                  <span className="min-w-0 flex-1 truncate text-[22px] font-medium">{p.name}</span>
                  {i === 0 && <span className="rounded-full bg-chip px-3 py-1 text-[16px] text-sub">기본</span>}
                  {i > 0 && (
                    <button aria-label={`${p.name} 삭제`} className="size-11 rounded-[10px] text-[20px] text-coral" onClick={() => actions.deletePerson(p.id)}>
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <input
                className={`${inputCls} min-w-[140px] flex-1`}
                value={pName}
                maxLength={20}
                onChange={(e) => setPName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addPerson()}
                placeholder="이름"
              />
              <div className="flex gap-1.5">
                {PERSON_PALETTE.map((c) => (
                  <button
                    key={c}
                    aria-label="색 선택"
                    onClick={() => setPColor(c)}
                    style={{ background: c, outline: pColor === c ? '3px solid #f3efe6' : used.has(c) ? '2px solid #5a5548' : 'none', outlineOffset: 2 }}
                    className="size-9 rounded-full"
                  />
                ))}
              </div>
              <button className={btnPrimary} onClick={addPerson}>
                추가
              </button>
            </div>
          </Card>

          <Card title="화면" sub="냉장고에 계속 켜두는 화면이라 밤엔 어둡게 줄일 수 있어요">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-[21px]">밤에 화면 어둡게</div>
                <div className="text-[17px] text-sub">밤 10시 ~ 아침 6시</div>
              </div>
              <Seg
                options={[['자동', 'auto'], ['끄기', 'off']] as const}
                value={state.settings.nightMode}
                onChange={(v) => actions.updateHousehold({ nightMode: v })}
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-[21px]">기본 유통기한</div>
                <div className="text-[17px] text-sub">기한을 따로 정하지 않은 재료에 써요</div>
              </div>
              <div className="flex items-center gap-1.5">
                <button aria-label="줄이기" className={stepBtn} onClick={() => days > 1 && actions.updateHousehold({ defaultDays: days - 1 })}>
                  −
                </button>
                <span className="tnum w-[72px] text-center text-[24px] font-bold">{days}일</span>
                <button aria-label="늘리기" className={stepBtn} onClick={() => days < 60 && actions.updateHousehold({ defaultDays: days + 1 })}>
                  +
                </button>
              </div>
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-3.5">
          <Card title={`우리 집 · ${state.household.name}`} sub="같은 구글 계정으로 로그인하면 어느 기기에서든 같은 데이터가 보여요">
            <div className="flex flex-col gap-1.5">
              {(members.data ?? []).map((m) => (
                <div key={m.userId} className="flex items-center gap-3 rounded-[14px] bg-card2 py-2 pl-3 pr-2">
                  {m.avatarUrl ? (
                    <img src={m.avatarUrl} alt="" referrerPolicy="no-referrer" className="size-10 shrink-0 rounded-full" />
                  ) : (
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-chip2 text-[18px]">{m.name.slice(0, 1)}</span>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[20px] font-medium">
                      {m.name}
                      {m.userId === me?.user.id && <span className="ml-2 text-[16px] text-sub">나</span>}
                    </div>
                    {m.email && <div className="truncate text-[15px] text-sub">{m.email}</div>}
                  </div>
                  <span className="rounded-full bg-chip px-3 py-1 text-[16px] text-sub">{m.role === 'OWNER' ? '관리자' : '구성원'}</span>
                  {isOwner && m.userId !== me?.user.id && (
                    <button aria-label={`${m.name} 내보내기`} className="size-11 rounded-[10px] text-[20px] text-coral" onClick={() => removeMember(m)}>
                      ✕
                    </button>
                  )}
                </div>
              ))}
              {members.isLoading && <div className="py-3 text-center text-sub">불러오는 중…</div>}
            </div>

            {isOwner && (
              <div className="flex flex-col gap-2.5 border-t border-line pt-3.5">
                <button className={`${btnGhost} self-start`} onClick={issueInvite}>
                  가족 초대 코드 만들기
                </button>
                {invite && (
                  <div className="flex flex-wrap items-center gap-3 rounded-[14px] bg-card2 p-4">
                    <span className="tnum text-[32px] font-bold tracking-[0.18em] text-amber">{invite.code}</span>
                    <button className="h-11 rounded-xl bg-chip px-4 text-[18px]" onClick={() => copy(invite.code)}>
                      복사
                    </button>
                    <span className="basis-full text-[16px] text-sub">
                      {new Date(invite.expiresAt).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}까지, 한 번만 쓸 수 있어요
                      — 가족이 로그인 후 &quot;초대 코드로 참여&quot;에 입력해요
                    </span>
                  </div>
                )}
              </div>
            )}
          </Card>

          <Card title="계정과 데이터">
            <div className="flex flex-wrap gap-2.5">
              <button className={btnGhost} onClick={logout}>
                로그아웃
              </button>
              <button className={btnDanger} onClick={leave}>
                {confirmLeave ? '한 번 더 누르면 탈퇴' : '가구에서 나가기'}
              </button>
            </div>
            <div className="border-t border-line pt-3.5">
              <button className={btnDanger} onClick={onReset}>
                {confirmReset ? '한 번 더 누르면 초기화' : '샘플 데이터로 되돌리기'}
              </button>
              <div className="mt-2 text-[16px] text-sub">일정·재료·장보기가 모두 샘플로 바뀌어요</div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
