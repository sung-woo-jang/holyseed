import {
  Infinity as InfinityIcon,
  Scissors,
  Wallet,
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

export interface LabPageGroup {
  /** 그룹 소제목. 섹션에 그룹이 1개뿐이면 렌더링하지 않음 */
  label?: string
  pages: LabPage[]
}

export interface LabSection {
  id: string
  /** 1차 사이드바 툴팁/2차 사이드바 헤더 */
  label: string
  icon: LucideIcon
  /** 활성 섹션 판정 기준 — 이 중 하나라도 pathname.startsWith(bp)면 활성 */
  basePaths: string[]
  groups: LabPageGroup[]
}

/** 섹션의 groups를 펼친 전체 페이지 목록 */
export function sectionPages(section: LabSection): LabPage[] {
  return section.groups.flatMap((g) => g.pages)
}

/**
 * 대시보드 섹션 정의 (1차 사이드바 = 섹션, 2차 사이드바 = 페이지)
 *
 * 새 섹션 추가 방법:
 * 1. 여기 SECTIONS에 항목 추가 (id/label/icon/basePaths/groups)
 * 2. App.tsx에 해당 페이지 라우트 추가
 */
export const SECTIONS: LabSection[] = [
  {
    id: 'quant',
    label: '라오어',
    icon: InfinityIcon,
    basePaths: ['/quant', '/vr'],
    groups: [
      {
        label: '무한매수법',
        pages: [
          { path: '/quant', label: '홈', end: true },
          { path: '/quant/chart', label: '차트' },
          { path: '/quant/cycles', label: '사이클', end: false },
          { path: '/quant/account', label: '계좌' },
          { path: '/quant/system', label: '시스템' },
        ],
      },
      {
        label: 'TQQQ VR',
        pages: [
          { path: '/vr', label: '개요', end: true },
          { path: '/vr/chart', label: '차트' },
          { path: '/vr/trend', label: '추이' },
          { path: '/vr/ladder', label: '예약표' },
          { path: '/vr/fills', label: '체결·사이클' },
          { path: '/vr/system', label: '시스템' },
        ],
      },
      {
        label: '자산 기록',
        pages: [{ path: '/quant/wealth', label: '실계좌' }],
      },
    ],
  },
  {
    id: 'finance',
    label: '가계부',
    icon: Wallet,
    basePaths: ['/worklog'],
    groups: [
      {
        pages: [
          { path: '/worklog/dashboard', label: '대시보드', end: true },
          { path: '/worklog', label: '근무 기록', end: true },
          { path: '/worklog/expense', label: '지출내역', end: true },
        ],
      },
    ],
  },
  {
    id: 'film',
    label: '필름 재단',
    icon: Scissors,
    basePaths: ['/film-cutting'],
    groups: [{ pages: [{ path: '/film-cutting', label: '재단 프로젝트', end: false }] }],
  },
]

export function findActiveSection(pathname: string): LabSection | undefined {
  return SECTIONS.find((section) => section.basePaths.some((bp) => pathname.startsWith(bp)))
}
