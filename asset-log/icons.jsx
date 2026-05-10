// icons.jsx — flat SVG icons used by the prototype

const Icon = {
  home: (c = 'currentColor') => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M3 11l9-7 9 7v9a2 2 0 01-2 2h-4v-7h-6v7H5a2 2 0 01-2-2v-9z"
        stroke={c} strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  ),
  wallet: (c = 'currentColor') => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="6" width="18" height="14" rx="2" stroke={c} strokeWidth="1.8" />
      <path d="M3 10h18M16 14h2" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  book: (c = 'currentColor') => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M4 5a2 2 0 012-2h12v18H6a2 2 0 01-2-2V5z" stroke={c} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M8 7h6M8 11h6" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  more: (c = 'currentColor') => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="5" cy="12" r="1.6" fill={c} />
      <circle cx="12" cy="12" r="1.6" fill={c} />
      <circle cx="19" cy="12" r="1.6" fill={c} />
    </svg>
  ),
  back: (c = 'currentColor') => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M15 6l-6 6 6 6" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  close: (c = 'currentColor') => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M6 6l12 12M18 6L6 18" stroke={c} strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  plus: (c = 'currentColor') => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M12 5v14M5 12h14" stroke={c} strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  ),
  chevronRight: (c = 'currentColor') => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M6 4l4 4-4 4" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  chevronDown: (c = 'currentColor') => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M4 6l4 4 4-4" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  arrowUp: (c = 'currentColor') => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M7 11V3M3 7l4-4 4 4" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  bell: (c = 'currentColor') => (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M5 9a6 6 0 1112 0v3l1.5 3h-15L5 12V9z" stroke={c} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9 18a2 2 0 004 0" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  search: (c = 'currentColor') => (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <circle cx="10" cy="10" r="6" stroke={c} strokeWidth="1.8" />
      <path d="M14.5 14.5L18 18" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  check: (c = 'currentColor') => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M4 10l4 4 8-8" stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  refresh: (c = 'currentColor') => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M3 9a6 6 0 0110-4.5L15 6M15 9a6 6 0 01-10 4.5L3 12M15 3v3h-3M3 15v-3h3"
        stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

window.Icon = Icon;
