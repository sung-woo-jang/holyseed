import type { ReactNode } from 'react';
import { useTheme } from '../../lib/theme';
import styles from './PickerOverlay.module.css';

interface PickerOverlayProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/**
 * 폼 시트(SheetModal) 내부에 띄우는 피커 오버레이.
 * SheetModal의 `overlay` prop으로 전달해 시트 위에 겹쳐 그린다.
 */
export default function PickerOverlay({ visible, title, onClose, children }: PickerOverlayProps) {
  const theme = useTheme();
  if (!visible) return null;

  const dim = theme.dark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.32)';

  return (
    <div className={styles.root} style={{ background: dim }}>
      <div className={styles.dismiss} onClick={onClose} />
      <div className={styles.panel}>
        <div className={styles.handle} />
        <span className={styles.title}>{title}</span>
        <div className={styles.scroll}>{children}</div>
      </div>
    </div>
  );
}
