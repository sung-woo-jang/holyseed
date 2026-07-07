import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import cn from 'classnames';
import { useBackClose } from '../../lib/useBackClose';
import styles from './Sheet.module.css';

interface SheetProps {
  visible: boolean;
  onClose: () => void;
  header?: string;
  cta?: ReactNode;
  children: ReactNode;
  /** 시트 위에 겹쳐 그리는 오버레이(피커 등) */
  overlay?: ReactNode;
}

/**
 * 바텀시트 베이스 — portal + CSS transition.
 * visible=false 전환 시 200ms 후 unmount.
 */
export default function Sheet({ visible, onClose, header, cta, children, overlay }: SheetProps) {
  const [mounted, setMounted] = useState(visible);
  const [open, setOpen] = useState(false);

  // 기기 뒤로가기로 시트 닫기
  useBackClose(visible, onClose);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      // mount 직후 한 프레임 뒤에 open 클래스 → transition 발동
      const raf = requestAnimationFrame(() => requestAnimationFrame(() => setOpen(true)));
      return () => cancelAnimationFrame(raf);
    }
    setOpen(false);
    const timer = setTimeout(() => setMounted(false), 220);
    return () => clearTimeout(timer);
  }, [visible]);

  if (!mounted) return null;

  return createPortal(
    <div className={cn(styles.root, open && styles.open)}>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.sheet}>
        <div className={styles.handle} />
        {header && <div className={styles.header}>{header}</div>}
        <div className={styles.body}>{children}</div>
        {cta && <div className={styles.cta}>{cta}</div>}
        {overlay}
      </div>
    </div>,
    document.body,
  );
}
