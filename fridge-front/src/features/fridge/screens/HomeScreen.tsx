import { useNavigate } from 'react-router-dom'
import { CalPlusIcon, CartIcon, FridgeIcon } from '@/components/icons'
import { useUiStore } from '@/stores/ui.store'
import EventCard from '../components/EventCard'
import ShopCheckRow from '../components/ShopRow'
import { eventsOn } from '../lib/calendar'
import { dLabel, fmtDate, hhmm, plus, todayIso } from '../lib/date'
import { TONE_BG, toIngredientViews } from '../lib/expiry'
import { toEventView } from '../lib/people'
import { WEATHER_HOURLY, WEATHER_SUMMARY } from '../weather.sample'
import { useFridgeActions } from '../hooks/useFridge'
import { useFridgeCtx } from '../layout/context'

export default function HomeScreen() {
  const { state, now } = useFridgeCtx()
  const navigate = useNavigate()
  const ui = useUiStore()
  const actions = useFridgeActions()

  const today = todayIso()
  const multi = state.people.length > 1
  const nowHM = hhmm(now)
  const todayEv = eventsOn(state.events, today, 'all', multi)
  const tomorrow = eventsOn(state.events, plus(1), 'all', multi)
  const urgent = toIngredientViews(state.ingredients).filter((x) => x.d <= 3)
  const shopOpen = state.shop.filter((x) => !x.done)
  const h = now.getHours()

  return (
    <div className="grid gap-5 lg:min-h-0 lg:flex-1 lg:grid-cols-[300px_minmax(0,1fr)_300px]">
      {/* 오늘 일정 */}
      <section className="flex flex-col gap-2.5 overflow-hidden rounded-[22px] bg-card p-[22px] lg:min-h-0">
        <div className="flex h-11 items-center gap-2">
          <button onClick={() => navigate('/calendar')} className="flex h-11 flex-1 items-center gap-2.5 text-left">
            <span className="text-[22px] font-semibold">오늘 일정</span>
            <span className="text-[18px] text-sub">{todayEv.length}개 ›</span>
          </button>
          <button
            aria-label="일정 추가"
            onClick={() => ui.openEvent(today)}
            className="size-11 rounded-xl bg-chip text-[26px] leading-none text-amber"
          >
            +
          </button>
        </div>
        {todayEv.slice(0, 5).map((e) => (
          <EventCard
            key={e.id}
            ev={toEventView(e, state.people)}
            dim={!!e.time && e.time < nowHM}
            onClick={() => ui.openEvent(e.date, e)}
          />
        ))}
        {todayEv.length === 0 && <div className="py-2 text-[20px] text-sub">오늘은 일정이 없어요</div>}
        <div className="mt-auto flex flex-col gap-1 border-t border-[#2f2d26] pt-3">
          <span className="text-[17px] text-sub">내일</span>
          <span className="text-[20px]">
            {tomorrow.length ? tomorrow.slice(0, 2).map((e) => `${e.title} ${e.time || '종일'}`).join(' · ') : '일정 없음'}
          </span>
        </div>
      </section>

      {/* 시계 · 날씨 · 빠른 추가 */}
      <section className="order-first flex min-w-0 flex-col items-center lg:order-none">
        <div className="flex flex-1 flex-col items-center justify-center gap-2.5 py-4">
          <div className="tnum text-[84px] font-medium leading-none tracking-[-2px] text-amber sm:text-[104px] lg:text-[128px]">
            {nowHM}
          </div>
          <div className="text-[26px] font-semibold lg:text-[30px]">{fmtDate(today)}</div>
          <div className="text-[19px] text-sub lg:text-[21px]">{WEATHER_SUMMARY}</div>
          <div className="mt-3 flex gap-2">
            {WEATHER_HOURLY.map(([temp, w], i) => (
              <div key={i} className="flex w-[72px] flex-col items-center gap-0.5 rounded-[14px] bg-card py-2.5 sm:w-[86px]">
                <span className="text-[17px] text-sub">{(h + 1 + i * 3) % 24}시</span>
                <span className="text-[22px] font-bold">{temp}°</span>
                <span className="text-[16px] text-sub">{w}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="grid w-full grid-cols-3 gap-2.5">
          {[
            { label: '일정 추가', icon: <CalPlusIcon size={26} />, on: () => ui.openEvent(today) },
            { label: '장보기 추가', icon: <CartIcon size={26} />, on: () => ui.openShop() },
            { label: '재료 넣기', icon: <FridgeIcon size={26} />, on: () => ui.openIngredient() },
          ].map((b) => (
            <button
              key={b.label}
              onClick={b.on}
              className="flex h-[88px] flex-col items-center justify-center gap-1.5 rounded-[18px] bg-card text-amber"
            >
              {b.icon}
              <span className="text-[17px] font-medium text-ink sm:text-[19px]">{b.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* 임박 재료 + 장보기 */}
      <div className="flex flex-col gap-5 lg:min-h-0">
        <section className="flex flex-col gap-2 rounded-[22px] bg-card p-[22px]">
          <button onClick={() => navigate('/ingredients')} className="flex h-10 items-center justify-between">
            <span className="text-[22px] font-semibold">유통기한 임박</span>
            <span className="text-[18px] text-sub">전체 ›</span>
          </button>
          {urgent.slice(0, 4).map((u) => (
            <button
              key={u.id}
              onClick={() => ui.openIngredient(u)}
              className="flex min-h-[46px] items-center justify-between"
            >
              <span className="text-[22px]">{u.name}</span>
              <span className={`flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[18px] font-bold text-bg ${TONE_BG[u.tone]}`}>
                {dLabel(u.d)} <span className="font-medium">{u.status}</span>
              </span>
            </button>
          ))}
          {urgent.length === 0 && <div className="text-[20px] text-teal">임박한 재료가 없어요</div>}
        </section>

        <section className="flex flex-col gap-1 overflow-hidden rounded-[22px] bg-card p-[22px] lg:min-h-0 lg:flex-1">
          <button onClick={() => navigate('/shopping')} className="flex h-10 items-center justify-between">
            <span className="text-[22px] font-semibold">장보기</span>
            <span className="text-[18px] text-sub">{shopOpen.length}개 ›</span>
          </button>
          {shopOpen.slice(0, 5).map((it) => (
            <ShopCheckRow key={it.id} item={it} compact onToggle={() => actions.toggleShop(it.id, !it.done)} />
          ))}
          {shopOpen.length === 0 && <div className="py-2 text-[20px] text-sub">살 게 없어요</div>}
          <div className="mt-auto text-[18px] text-sub">{shopOpen.length > 5 ? `외 ${shopOpen.length - 5}개` : ''}</div>
        </section>
      </div>
    </div>
  )
}
