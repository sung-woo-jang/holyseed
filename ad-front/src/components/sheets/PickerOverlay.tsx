import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import cn from 'classnames';
import { useTheme } from '../../lib/theme';
import { useBackClose } from '../../lib/useBackClose';
import styles from './PickerOverlay.module.css';

interface PickerOverlayProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

const DISMISS_HEIGHT_RATIO = 0.25;
const DISMISS_VELOCITY = 0.5;

/**
 * 시트 위에 겹쳐 뜨는 2단계 피커 — 화면 전체 기준 바텀시트.
 * (RN과 달리 웹은 portal 중첩이 자유로워 부모 시트 높이에 갇히지 않는다)
 * 기기 뒤로가기로 닫히고, 핸들/타이틀을 드래그해도 닫힌다(Sheet.tsx와 동일 패턴).
 */
export default function PickerOverlay({ visible, title, onClose, children }: PickerOverlayProps) {
  const theme = useTheme();
  const [mounted, setMounted] = useState(visible);
  const [open, setOpen] = useState(false);
  const [dragY, setDragY] = useState<number | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startY: number; startTime: number; lastY: number; lastTime: number } | null>(null);

  useBackClose(visible, onClose);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      const raf = requestAnimationFrame(() => requestAnimationFrame(() => setOpen(true)));
      return () => cancelAnimationFrame(raf);
    }
    setOpen(false);
    setDragY(null);
    const timer = setTimeout(() => setMounted(false), 220);
    return () => clearTimeout(timer);
  }, [visible]);

  if (!mounted) return null;

  function handlePointerDown(e: PointerEvent) {
    ;(e.currentTarget as Element).setPointerCapture(e.pointerId);
    const now = Date.now();
    dragRef.current = { startY: e.clientY, startTime: now, lastY: e.clientY, lastTime: now };
    setDragY(0);
  }

  function handlePointerMove(e: PointerEvent) {
    if (!dragRef.current) return;
    const delta = Math.max(0, e.clientY - dragRef.current.startY);
    dragRef.current.lastY = e.clientY;
    dragRef.current.lastTime = Date.now();
    setDragY(delta);
  }

  function handlePointerUp() {
    const drag = dragRef.current;
    dragRef.current = null;
    if (!drag) return;

    const delta = Math.max(0, drag.lastY - drag.startY);
    const elapsed = Math.max(1, drag.lastTime - drag.startTime);
    const velocity = delta / elapsed;
    const panelHeight = panelRef.current?.offsetHeight ?? 300;

    if (delta > panelHeight * DISMISS_HEIGHT_RATIO || velocity > DISMISS_VELOCITY) {
      setOpen(false);
      setDragY(null);
      onClose();
    } else {
      setDragY(null);
    }
  }

  const dragHandlers = {
    onPointerDown: handlePointerDown,
    onPointerMove: handlePointerMove,
    onPointerUp: handlePointerUp,
    onPointerCancel: handlePointerUp,
  };

  const dim = theme.dark ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.4)';

  return createPortal(
    <div className={cn(styles.root, open && styles.open)}>
      <div className={styles.dismiss} style={{ background: dim }} onClick={onClose} />
      <div
        ref={panelRef}
        className={styles.panel}
        style={dragY !== null ? { transform: `translateY(${dragY}px)`, transition: 'none' } : undefined}
      >
        <div className={styles.handle} {...dragHandlers} />
        <span className={styles.title} {...dragHandlers}>
          {title}
        </span>
        <div className={styles.scroll}>{children}</div>
      </div>
    </div>,
    document.body,
  );
}
