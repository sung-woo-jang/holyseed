import {
  CalendarDays,
  ChartCandlestick,
  HardHat,
  Infinity as InfinityIcon,
  PiggyBank,
  Scissors,
  type LucideIcon,
} from 'lucide-react'

export interface LabPage {
  /** 라우트 경로 */
  path: string
  /** 2차 사이드바에 표시할 이름 */
  label: string
  /** NavLink end 매칭 여부 (하위 경로가 있는 페이지는 false) */
  end?: boolean
}

export interface LabSection {
  id: string
  /** 1차 사이드바 툴팁/2차 사이드바 헤더 */
  label: string
  icon: LucideIcon
  /** 활성 섹션 판정 기준 — pathname.startsWith(basePath) */
  basePath: string
  pages: LabPage[]
}

/**
 * 대시보드 섹션 정의 (1차 사이드바 = 섹션, 2차 사이드바 = 페이지)
 *
 * 새 섹션 추가 방법:
 * 1. 여기 SECTIONS에 항목 추가 (id/label/icon/basePath/pages)
 * 2. App.tsx에 해당 페이지 라우트 추가
 */
export const SECTIONS: LabSection[] = [
  {
    id: 'laofus',
    label: '무한매수법',
    icon: InfinityIcon,
    basePath: '/laofus',
    pages: [
      { path: '/laofus', label: '홈', end: true },
      { path: '/laofus/chart', label: '차트' },
      { path: '/laofus/cycles', label: '사이클', end: false },
      { path: '/laofus/account', label: '계좌' },
      { path: '/laofus/system', label: '시스템' },
    ],
  },
  {
    id: 'vr',
    label: 'TQQQ VR',
    icon: ChartCandlestick,
    basePath: '/vr',
    pages: [
      { path: '/vr', label: '개요', end: true },
      { path: '/vr/ladder', label: '예약표' },
      { path: '/vr/fills', label: '체결·사이클' },
    ],
  },
  {
    id: 'worklog',
    label: '근무일지',
    icon: HardHat,
    basePath: '/worklog',
    pages: [{ path: '/worklog', label: '근무 기록', end: true }],
  },
  {
    id: 'schedule',
    label: '일정',
    icon: CalendarDays,
    basePath: '/schedule',
    pages: [
      { path: '/schedule', label: '캘린더', end: true },
      { path: '/schedule/list', label: '리스트' },
    ],
  },
  {
    id: 'saving',
    label: '저축',
    icon: PiggyBank,
    basePath: '/saving',
    pages: [{ path: '/saving', label: '저축 플래너', end: true }],
  },
  {
    id: 'film',
    label: '필름 재단',
    icon: Scissors,
    basePath: '/film-cutting',
    pages: [{ path: '/film-cutting', label: '재단 프로젝트', end: false }],
  },
]

export function findActiveSection(pathname: string): LabSection | undefined {
  return SECTIONS.find((section) => pathname.startsWith(section.basePath))
}
