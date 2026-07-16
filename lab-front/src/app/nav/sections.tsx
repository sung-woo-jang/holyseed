import { NotebookPen, Scissors, type LucideIcon } from 'lucide-react'

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
    id: 'notion',
    label: '노션 기록',
    icon: NotebookPen,
    basePath: '/notion',
    pages: [{ path: '/notion', label: '개요', end: true }],
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
