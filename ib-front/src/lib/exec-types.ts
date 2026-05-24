export const EXEC_LABEL: Record<string, string> = {
  buy_full: '1회 매수',
  buy_half_star: '★LOC 매수',
  buy_half_avg: '평단LOC 매수',
  sell_quarter: '쿼터 매도',
  sell_fixed: '지정가 매도',
  sell_moc: 'MOC 매도',
  no_exec: '미체결',
}

export const T_DELTA: Record<string, string> = {
  buy_full: 'T + 1',
  buy_half_star: 'T + 0.5',
  buy_half_avg: 'T + 0.5',
  sell_quarter: 'T × 0.75',
  sell_fixed: 'T × 0.25',
  sell_moc: 'T × 0.95',
  no_exec: '—',
}

interface ExecTypeItem {
  value: string
  label: string
  tdelta: string
  badgeBg: string
  badgeColor: string
}

export const EXEC_GROUPS: { label: string; items: ExecTypeItem[] }[] = [
  {
    label: '매수',
    items: [
      { value: 'buy_full', label: '1회 매수', tdelta: 'T + 1', badgeBg: 'rgba(34,197,94,0.15)', badgeColor: '#22c55e' },
      {
        value: 'buy_half_star',
        label: '★LOC 매수',
        tdelta: 'T + 0.5',
        badgeBg: 'var(--color-star-bg)',
        badgeColor: '#d97706',
      },
      {
        value: 'buy_half_avg',
        label: '평단LOC 매수',
        tdelta: 'T + 0.5',
        badgeBg: 'var(--color-star-bg)',
        badgeColor: '#d97706',
      },
    ],
  },
  {
    label: '매도',
    items: [
      {
        value: 'sell_quarter',
        label: '쿼터 매도',
        tdelta: 'T × 0.75',
        badgeBg: 'var(--color-sell-bg)',
        badgeColor: '#ef4444',
      },
      {
        value: 'sell_fixed',
        label: '지정가 매도',
        tdelta: 'T × 0.25',
        badgeBg: 'var(--color-sell-bg)',
        badgeColor: '#ef4444',
      },
      {
        value: 'sell_moc',
        label: 'MOC 매도',
        tdelta: 'T × 0.95',
        badgeBg: 'var(--color-sell-bg)',
        badgeColor: '#ef4444',
      },
    ],
  },
  {
    label: '기타',
    items: [
      {
        value: 'no_exec',
        label: '미체결',
        tdelta: '—',
        badgeBg: 'var(--color-bg)',
        badgeColor: 'var(--color-text-secondary)',
      },
    ],
  },
]
