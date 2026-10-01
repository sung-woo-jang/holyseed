import type { EventView } from '../lib/people'

export default function EventCard({
  ev,
  onClick,
  dim = false,
  showRepeat = false,
}: {
  ev: EventView
  onClick: () => void
  dim?: boolean
  showRepeat?: boolean
}) {
  return (
    <button
      onClick={onClick}
      style={{ opacity: dim ? 0.45 : 1 }}
      className="flex shrink-0 gap-3.5 rounded-[14px] bg-card2 px-3.5 py-3 text-left"
    >
      <span className="w-[5px] shrink-0 rounded-[3px]" style={{ background: ev.color }} />
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="tnum flex gap-2 text-[18px]">
          <span className="text-amber">
            {ev.timeLabel}
            {showRepeat ? ev.repeatMark : ''}
          </span>
          <span style={{ color: ev.color }}>{ev.whoLabel}</span>
        </span>
        <span className="text-[21px] font-medium">{ev.title}</span>
      </span>
    </button>
  )
}
