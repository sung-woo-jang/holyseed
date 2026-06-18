import styles from './DeleteConfirmModal.module.css';
import cn from 'classnames';

interface DeleteConfirmModalProps {
  onConfirm: () => void;
  onCancel: () => void;
  isProcessing?: boolean;
}

export function DeleteConfirmModal({
  onConfirm,
  onCancel,
  isProcessing = false,
}: DeleteConfirmModalProps) {
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h3 className={styles.title}>미디어 삭제</h3>
        <p className={styles.description}>
          이 미디어를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
        </p>
        <div className={styles.actions}>
          <button
            onClick={onCancel}
            disabled={isProcessing}
            className={cn(styles.button, styles.buttonCancel)}
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            disabled={isProcessing}
            className={cn(styles.button, styles.buttonDelete)}
          >
            {isProcessing ? '삭제 중...' : '삭제'}
          </button>
        </div>
      </div>
    </div>
  );
}
