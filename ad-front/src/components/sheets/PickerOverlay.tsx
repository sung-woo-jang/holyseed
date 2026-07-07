import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../../lib/theme';
import { useBackClose } from '../../lib/useBackClose';
import styles from './PickerOverlay.module.css';

interface PickerOverlayProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/**
 * 시트 위에 겹쳐 뜨는 2단계 피커 — 화면 전체 기준 바텀시트.
 * (RN과 달리 웹은 portal 중첩이 자유로워 부모 시트 높이에 갇히지 않는다)
 * 기기 뒤로가기로 닫힌다.
 */
export default function PickerOverlay({ visible, title, onClose, children }: PickerOverlayProps) {
  const theme = useTheme();
  useBackClose(visible, onClose);

  if (!visible) return null;

  const dim = theme.dark ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.4)';

  return createPortal(
    <div className={styles.root}>
      <div className={styles.dismiss} style={{ background: dim }} onClick={onClose} />
      <div className={styles.panel}>
        <div className={styles.handle} />
        <span className={styles.title}>{title}</span>
        <div className={styles.scroll}>{children}</div>
      </div>
    </div>,
    document.body,
  );
}
