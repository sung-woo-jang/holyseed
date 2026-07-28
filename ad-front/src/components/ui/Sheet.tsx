import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react';
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

/** 드래그 판정 기준 — 시트 높이의 25% 이상 끌거나, 그보다 덜 끌어도 빠르게(px/ms) 놓으면 닫힘 */
const DISMISS_HEIGHT_RATIO = 0.25;
const DISMISS_VELOCITY = 0.5;

/**
 * 바텀시트 베이스 — portal + CSS transition.
 * visible=false 전환 시 200ms 후 unmount.
 * 핸들/헤더를 드래그해 끌어내리면 실시간으로 따라오다 임계값을 넘으면 닫힘(네이티브 바텀시트 UX).
 */
export default function Sheet({ visible, onClose, header, cta, children, overlay }: SheetProps) {
  const [mounted, setMounted] = useState(visible);
  const [open, setOpen] = useState(false);
  const [dragY, setDragY] = useState<number | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startY: number; startTime: number; lastY: number; lastTime: number } | null>(null);

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
    const sheetHeight = sheetRef.current?.offsetHeight ?? 300;

    if (delta > sheetHeight * DISMISS_HEIGHT_RATIO || velocity > DISMISS_VELOCITY) {
      // 부모의 visible 갱신을 기다리지 않고 즉시 닫힘 애니메이션 시작 (드래그 위치→100%로 자연스럽게 이어짐)
      setOpen(false);
      setDragY(null);
      onClose();
    } else {
      setDragY(null); // 임계값 미달 — 원위치로 스냅백
    }
  }

  const dragHandlers = {
    onPointerDown: handlePointerDown,
    onPointerMove: handlePointerMove,
    onPointerUp: handlePointerUp,
    onPointerCancel: handlePointerUp,
  };

  return createPortal(
    <div className={cn(styles.root, open && styles.open)}>
      <div className={styles.backdrop} onClick={onClose} />
      <div
        ref={sheetRef}
        className={styles.sheet}
        style={dragY !== null ? { transform: `translateY(${dragY}px)`, transition: 'none' } : undefined}
      >
        <div className={styles.handle} {...dragHandlers} />
        {header && (
          <div className={styles.header} {...dragHandlers}>
            {header}
          </div>
        )}
        <div className={styles.body}>{children}</div>
        {cta && <div className={styles.cta}>{cta}</div>}
        {overlay}
      </div>
    </div>,
    document.body,
  );
}
