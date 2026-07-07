import { useState } from 'react';
import AttendanceForm from './AttendanceForm';
import styles from './AttendanceModal.module.css';

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  coupleId: string;
  groomName: string;
  brideName: string;
}

export default function AttendanceModal({
  isOpen,
  onClose,
  coupleId,
  groomName,
  brideName,
}: AttendanceModalProps) {
  const [submitSuccess, setSubmitSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSuccess = () => {
    setSubmitSuccess(true);
    setTimeout(() => {
      setSubmitSuccess(false);
      onClose();
    }, 2000);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modal}>
        <button className={styles.closeButton} onClick={onClose} aria-label="Close">
          ✕
        </button>

        <div className={styles.content}>
          {submitSuccess ? (
            <div className={styles.successMessage}>
              <div className={styles.successIcon}>✓</div>
              <h2>참석 의사가 전달되었습니다</h2>
              <p>감사합니다!</p>
            </div>
          ) : (
            <>
              <div className={styles.header}>
                <div className={styles.icon}>✉️</div>
                <h2 className={styles.title}>참석 의사 전달</h2>
                <p className={styles.subtitle}>{groomName} ❤️ {brideName}</p>
              </div>

              <AttendanceForm coupleId={coupleId} onSuccess={handleSuccess} onCancel={onClose} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
