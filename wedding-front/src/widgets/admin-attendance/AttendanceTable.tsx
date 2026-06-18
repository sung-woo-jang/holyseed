

import type { Attendance } ;
import styles from './AttendanceTable.module.css';
import cn from 'classnames';

interface AttendanceTableProps {
  attendances: Attendance[];
  onDelete: (id: string) => void;
  loading?: boolean;
}

export function AttendanceTable({ attendances, onDelete, loading }: AttendanceTableProps) {
  if (loading) {
    return <div className={styles.loading}>로딩 중...</div>;
  }

  if (attendances.length === 0) {
    return (
      <div className={styles.empty}>
        <svg className={styles.emptyIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
        <p className={styles.emptyText}>참석 응답이 없습니다</p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ATTENDING':
        return { className: styles.badgeAttending, label: '참석' };
      case 'NOT_ATTENDING':
        return { className: styles.badgeNotAttending, label: '불참' };
      case 'MAYBE':
        return { className: styles.badgeMaybe, label: '미정' };
      default:
        return { className: '', label: status };
    }
  };

  return (
    <div className={styles.container}>
      {attendances.map((attendance) => {
        const badge = getStatusBadge(attendance.attendanceStatus);
        return (
          <div key={attendance.id} className={styles.card}>
            <div className={styles.cardContent}>
              <div className={styles.cardHeader}>
                <div className={styles.guestName}>{attendance.guestName}</div>
                <span className={cn(styles.badge, badge.className)}>
                  {badge.label}
                </span>
              </div>

              <div className={styles.cardBody}>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>인원</span>
                  <span className={styles.infoValue}>{attendance.guestCount}명</span>
                </div>

                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>전화번호</span>
                  <span className={styles.infoValue}>{attendance.phoneNumber || '-'}</span>
                </div>

                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>등록일</span>
                  <span className={styles.infoValue}>
                    {new Date(attendance.createdAt).toLocaleDateString('ko-KR')}
                  </span>
                </div>

                {attendance.message && (
                  <div className={styles.message}>
                    <div className={styles.messageLabel}>메시지</div>
                    <div className={styles.messageText}>{attendance.message}</div>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.cardFooter}>
              <button
                onClick={() => {
                  if (confirm('정말 삭제하시겠습니까?')) {
                    onDelete(attendance.id);
                  }
                }}
                className={styles.buttonDelete}
              >
                삭제
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
