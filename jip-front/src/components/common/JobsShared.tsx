// 시공 일지 공용 컴포넌트 (프로토타입 jobs-shared.jsx 기반)

export const JIcon = {
  Lock: ({ s = 14 }: { s?: number }) => (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  ),
  Eye: ({ s = 16 }: { s?: number }) => (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  Plus: ({ s = 18 }: { s?: number }) => (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  Search: ({ s = 16 }: { s?: number }) => (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  ),
  Copy: ({ s = 14 }: { s?: number }) => (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  ),
  Edit: ({ s = 15 }: { s?: number }) => (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  Globe: ({ s = 16 }: { s?: number }) => (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </svg>
  ),
  X: ({ s = 16 }: { s?: number }) => (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
    >
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  ),
  Check: ({ s = 12 }: { s?: number }) => (
    <svg
      width={s}
      height={s}
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2.5 7.4L5.6 10.5 11.5 3.5" />
    </svg>
  ),
}

interface JPhotoProps {
  fileUrl?: string | null
  role: 'before' | 'after'
  label?: string
  idx?: number
  style?: React.CSSProperties
}

export function JPhoto({ fileUrl, role, label, idx, style }: JPhotoProps) {
  const displayLabel = label || (role === 'before' ? '시공 전' : '시공 후')
  if (fileUrl) {
    return (
      <div className={`jobs-photo ${role}`} style={style}>
        <div className="corner">
          {role === 'before' ? 'BEFORE' : 'AFTER'}
          {idx != null ? ` ${String(idx + 1).padStart(2, '0')}` : ''}
        </div>
        <img
          src={fileUrl}
          alt={displayLabel}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>
    )
  }
  return (
    <div className={`jobs-photo ${role}`} style={style}>
      <div className="corner">
        {role === 'before' ? 'BEFORE' : 'AFTER'}
        {idx != null ? ` ${String(idx + 1).padStart(2, '0')}` : ''}
      </div>
      <div className="lbl">{displayLabel}</div>
    </div>
  )
}

interface JStatusPillProps {
  status?: string
}
export function JStatusPill({ status }: JStatusPillProps) {
  const cls = status === '시공완료' ? 'done' : status === '시공대기' ? 'pending' : status === '문의접수' ? 'new' : ''
  return (
    <span className={`jobs-pill ${cls}`}>
      <span className="dot" />
      {status ?? '—'}
    </span>
  )
}

interface JPubToggleProps {
  on: boolean
  onClick: () => void
  title?: string
}
export function JPubToggle({ on, onClick, title }: JPubToggleProps) {
  return (
    <button
      type="button"
      className={`jobs-pub ${on ? 'on' : ''}`}
      onClick={onClick}
      title={title ?? (on ? '공개 중' : '숨김')}
    >
      <span className="box">
        <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
          <path
            d="M2.5 7.4L5.6 10.5 11.5 3.5"
            stroke="white"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      공개
    </button>
  )
}
