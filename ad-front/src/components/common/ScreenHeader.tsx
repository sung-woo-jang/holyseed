import type { ReactNode } from 'react';
import { useTheme } from '../../lib/theme';
import { Icon } from './Icon';
import styles from './ScreenHeader.module.css';

interface ScreenHeaderProps {
  title: string;
  onBack?: () => void;
  right?: ReactNode;
}

export default function ScreenHeader({ title, onBack, right }: ScreenHeaderProps) {
  const theme = useTheme();
  return (
    <div className={styles.header}>
      {onBack && (
        <button type="button" className={styles.backBtn} onClick={onBack} aria-label="뒤로가기">
          {Icon.back(theme.text)}
        </button>
      )}
      <span className={styles.title}>{title}</span>
      {right && <div className={styles.right}>{right}</div>}
    </div>
  );
}

interface HeaderButtonProps {
  label: string;
  onPress: () => void;
}

export function HeaderButton({ label, onPress }: HeaderButtonProps) {
  return (
    <button type="button" className={styles.headerBtn} onClick={onPress}>
      {label}
    </button>
  );
}
