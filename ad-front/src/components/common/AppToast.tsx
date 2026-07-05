import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './AppToast.module.css';

interface AppToastProps {
  open: boolean;
  text: string;
  onClose: () => void;
}

export default function AppToast({ open, text, onClose }: AppToastProps) {
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(onClose, 2500);
    return () => clearTimeout(timer);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className={styles.wrap}>
      <div className={styles.toast}>{text}</div>
    </div>,
    document.body,
  );
}
