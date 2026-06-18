

import { useForm } from 'react-hook-form';
import { api } from '@/lib/api';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import styles from './AttendanceModal.module.css';

const attendanceFormSchema = z.object({
  guestName: z.string().min(1, '이름을 입력해주세요').max(50),
  guestCount: z.number().int().min(1, '최소 1명').max(10, '최대 10명'),
  attendanceStatus: z.enum(['ATTENDING', 'NOT_ATTENDING', 'MAYBE']),
  message: z.string().max(500).optional(),
  phoneNumber: z.string().max(20).optional(),
});

type AttendanceFormData = z.infer<typeof attendanceFormSchema>;

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AttendanceFormData>({
    resolver: zodResolver(attendanceFormSchema),
    defaultValues: {
      guestCount: 1,
      attendanceStatus: 'ATTENDING',
    },
  });

  if (!isOpen) return null;

  const onSubmit = async (data: AttendanceFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await api.post('/attendance', { coupleId, ...data });

      setSubmitSuccess(true);
      reset();
      setTimeout(() => {
        setSubmitSuccess(false);
        onClose();
      }, 2000);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : '오류가 발생했습니다');
    } finally {
      setIsSubmitting(false);
    }
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

              <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
                {submitError && (
                  <div className={styles.errorMessage}>
                    {submitError}
                  </div>
                )}

                {/* Guest Name */}
                <div className={styles.formGroup}>
                  <label htmlFor="guestName">성함 *</label>
                  <input
                    {...register('guestName')}
                    id="guestName"
                    type="text"
                    placeholder="홍길동"
                    className={errors.guestName ? styles.inputError : ''}
                  />
                  {errors.guestName && (
                    <span className={styles.fieldError}>{errors.guestName.message}</span>
                  )}
                </div>

                {/* Attendance Status */}
                <div className={styles.formGroup}>
                  <label htmlFor="attendanceStatus">참석 여부 *</label>
                  <select
                    {...register('attendanceStatus')}
                    id="attendanceStatus"
                    className={errors.attendanceStatus ? styles.inputError : ''}
                  >
                    <option value="ATTENDING">참석</option>
                    <option value="NOT_ATTENDING">불참</option>
                    <option value="MAYBE">미정</option>
                  </select>
                  {errors.attendanceStatus && (
                    <span className={styles.fieldError}>{errors.attendanceStatus.message}</span>
                  )}
                </div>

                {/* Guest Count */}
                <div className={styles.formGroup}>
                  <label htmlFor="guestCount">인원 수 *</label>
                  <input
                    {...register('guestCount', { valueAsNumber: true })}
                    id="guestCount"
                    type="number"
                    min="1"
                    max="10"
                    className={errors.guestCount ? styles.inputError : ''}
                  />
                  {errors.guestCount && (
                    <span className={styles.fieldError}>{errors.guestCount.message}</span>
                  )}
                </div>

                {/* Phone Number */}
                <div className={styles.formGroup}>
                  <label htmlFor="phoneNumber">연락처</label>
                  <input
                    {...register('phoneNumber')}
                    id="phoneNumber"
                    type="tel"
                    placeholder="010-1234-5678"
                    className={errors.phoneNumber ? styles.inputError : ''}
                  />
                  {errors.phoneNumber && (
                    <span className={styles.fieldError}>{errors.phoneNumber.message}</span>
                  )}
                </div>

                {/* Message */}
                <div className={styles.formGroup}>
                  <label htmlFor="message">축하 메시지</label>
                  <textarea
                    {...register('message')}
                    id="message"
                    rows={4}
                    placeholder="축하 메시지를 남겨주세요"
                    className={errors.message ? styles.inputError : ''}
                  />
                  {errors.message && (
                    <span className={styles.fieldError}>{errors.message.message}</span>
                  )}
                </div>

                {/* Submit Button */}
                <div className={styles.formActions}>
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className={styles.cancelButton}
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={styles.submitButton}
                  >
                    {isSubmitting ? '전송 중...' : '전달하기'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
