/** 태그 프리셋 + chip 색상 (노션 태그 이관) */
export const TAG_PRESETS = ['기념일', '데이트', '중요일정', '여행', '기타', '개인일정', '교회'] as const

const TAG_COLORS: Record<string, string> = {
  기념일: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200',
  데이트: 'bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-200',
  중요일정: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
  여행: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200',
  기타: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
  개인일정: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
  교회: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200',
}

export function tagColor(tag: string): string {
  return TAG_COLORS[tag] ?? TAG_COLORS['기타']
}
