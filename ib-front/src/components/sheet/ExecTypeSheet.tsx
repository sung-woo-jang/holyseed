import { BottomSheet } from '@/components/common/BottomSheet'
import { EXEC_GROUPS, EXEC_LABEL } from '@/lib/exec-types'

interface Props {
  selected: string
  onSelect: (val: string) => void
  onClose: () => void
}

export function ExecTypeSheet({ selected, onSelect, onClose }: Props) {
  return (
    <BottomSheet onClose={onClose}>
      {(requestClose) => (
        <>
          {/* 헤더 */}
          <div
            style={{
              padding: '4px 20px 14px',
              borderBottom: '1px solid var(--color-border)',
              fontWeight: 700,
              fontSize: 15,
              textAlign: 'center',
            }}
          >
            체결 유형 선택
          </div>

          {/* 그룹별 목록 */}
          <div style={{ paddingBottom: 16 }}>
            {EXEC_GROUPS.map((group) => (
              <div key={group.label}>
                {/* 섹션 헤더 */}
                <div
                  style={{
                    padding: '12px 20px 6px',
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'var(--color-text-secondary)',
                    letterSpacing: '0.04em',
                  }}
                >
                  {group.label}
                </div>

                {/* 아이템 */}
                <div style={{ padding: '0 12px' }}>
                  {group.items.map((item) => {
                    const isSelected = selected === item.value
                    return (
                      <button
                        key={item.value}
                        onClick={() => {
                          onSelect(item.value)
                          requestClose()
                        }}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          width: '100%',
                          padding: '14px 12px',
                          background: isSelected ? 'var(--color-avg-bg)' : 'none',
                          border: 'none',
                          borderRadius: 12,
                          textAlign: 'left',
                          fontSize: 16,
                          color: isSelected ? 'var(--color-primary)' : 'var(--color-text)',
                          cursor: 'pointer',
                          fontWeight: isSelected ? 700 : 400,
                          marginBottom: 2,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {isSelected && <span style={{ fontSize: 14, color: 'var(--color-primary)' }}>✓</span>}
                          <span>{item.label}</span>
                        </div>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            padding: '3px 9px',
                            borderRadius: 8,
                            background: item.badgeBg,
                            color: item.badgeColor,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {item.tdelta}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </BottomSheet>
  )
}

export { EXEC_LABEL }
