import { createPortal } from 'react-dom';
import Loader from '../ui/Loader';
import styles from './ConfirmDialog.module.css';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export default function ConfirmDialog({
  visible,
  title,
  description,
  confirmText = '확인',
  cancelText = '취소',
  danger = false,
  loading = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  if (!visible) return null;

  return createPortal(
    <div className={styles.root}>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.dialog}>
        <span className={styles.title}>{title}</span>
        {description && <span className={styles.desc}>{description}</span>}
        <div className={styles.buttons}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>
            {cancelText}
          </button>
          <button
            type="button"
            className={danger ? styles.dangerBtn : styles.confirmBtn}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? <Loader color="#fff" /> : confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
