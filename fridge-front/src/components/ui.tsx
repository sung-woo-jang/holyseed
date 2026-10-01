import { useEffect, type ReactNode } from 'react'

export const btnPrimary =
  'h-14 px-6 rounded-[14px] bg-amber text-bg font-bold text-[20px] whitespace-nowrap disabled:opacity-40'
export const btnGhost =
  'h-14 px-5 rounded-[14px] border-[1.5px] border-line bg-transparent text-ink text-[20px] whitespace-nowrap disabled:opacity-40'
export const btnDanger =
  'h-14 px-5 rounded-[14px] border-[1.5px] border-coral bg-transparent text-coral text-[20px] whitespace-nowrap'
export const inputCls =
  'min-w-0 h-14 rounded-[14px] border-[1.5px] border-line bg-bg text-ink text-[21px] px-[18px] outline-none focus:border-amber'

export function Seg<T extends string>({
  options,
  value,
  onChange,
  inset = 'bg-bg',
  h = 'h-12',
}: {
  options: readonly (readonly [string, T])[]
  value: T
  onChange: (v: T) => void
  inset?: string
  h?: string
}) {
  return (
    <div className={`flex shrink-0 rounded-[14px] p-1 ${inset}`}>
      {options.map(([label, v]) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={`${h} px-[18px] rounded-[10px] text-[19px] font-semibold whitespace-nowrap ${
            value === v ? 'bg-line text-ink' : 'bg-transparent text-sub'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

export function Chip({
  on,
  onClick,
  children,
  className = '',
}: {
  on: boolean
  onClick: () => void
  children: ReactNode
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-[50px] px-5 rounded-xl border-[1.5px] text-[19px] font-semibold whitespace-nowrap ${
        on ? 'bg-ink text-bg border-ink' : 'bg-transparent text-ink border-line'
      } ${className}`}
    >
      {children}
    </button>
  )
}

export function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label="닫기"
      onClick={onClick}
      className="size-11 shrink-0 rounded-xl bg-chip text-sub text-[20px]"
    >
      ✕
    </button>
  )
}

export function Sheet({
  title,
  onClose,
  width = 660,
  children,
}: {
  title: ReactNode
  onClose: () => void
  width?: number
  children: ReactNode
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-30 flex items-end justify-center bg-[rgba(8,7,5,.72)] sm:items-start sm:p-9"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: width }}
        className="flex max-h-[92dvh] w-full flex-col gap-4 overflow-y-auto rounded-t-3xl bg-card px-5 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-[0_20px_60px_rgba(0,0,0,.5)] sm:max-h-[calc(100dvh-4.5rem)] sm:rounded-3xl sm:px-7"
      >
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1 text-[26px] font-bold">{title}</div>
          <CloseButton onClick={onClose} />
        </div>
        {children}
      </div>
    </div>
  )
}

export function Splash({ children }: { children?: ReactNode }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 bg-bg px-6 text-center text-sub">
      {children ?? '불러오는 중…'}
    </div>
  )
}

export function Check({ done, size = 'md' }: { done: boolean; size?: 'sm' | 'md' }) {
  const dim = size === 'md' ? 'size-10 text-[24px] rounded-xl' : 'size-[34px] text-[20px] rounded-[10px]'
  return (
    <span
      className={`${dim} flex shrink-0 items-center justify-center border-2 font-bold text-bg ${
        done ? 'border-teal bg-teal' : 'border-[#5a5548] bg-transparent'
      }`}
    >
      {done ? '✓' : ''}
    </span>
  )
}
