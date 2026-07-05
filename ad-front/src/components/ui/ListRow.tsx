import type { ReactNode } from 'react';
import cn from 'classnames';
import styles from './ListRow.module.css';

interface ListRowProps {
  left?: ReactNode;
  contents?: ReactNode;
  right?: ReactNode;
  withArrow?: boolean;
  onPress?: () => void;
  verticalPadding?: 'none' | 'small' | 'medium' | 'large';
}

export default function ListRow({
  left,
  contents,
  right,
  withArrow = false,
  onPress,
  verticalPadding = 'medium',
}: ListRowProps) {
  const inner = (
    <>
      {left && <div className={styles.left}>{left}</div>}
      <div className={styles.contents}>{contents}</div>
      {right && <div className={styles.right}>{right}</div>}
      {withArrow && (
        <svg className={styles.arrow} width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M6 4l4 4-4 4"
            stroke="var(--text-muted)"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </>
  );

  const className = cn(styles.row, styles[`vp-${verticalPadding}`]);

  if (onPress) {
    // 내부에 버튼/스위치가 올 수 있어 <button> 대신 role="button" div 사용
    return (
      <div
        role="button"
        tabIndex={0}
        className={cn(className, styles.pressable)}
        onClick={onPress}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onPress();
          }
        }}
      >
        {inner}
      </div>
    );
  }
  return <div className={className}>{inner}</div>;
}
