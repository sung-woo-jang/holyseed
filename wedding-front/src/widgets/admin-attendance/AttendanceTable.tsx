import type { Attendance } from '@/shared/types';
import styles from './AttendanceTable.module.css';
import cn from 'classnames';

interface AttendanceTableProps {
  attendances: Attendance[];
  onDelete: (id: string) => void;
  loading?: boolean;
}

const STATUS_META: Record<string, { label: string; cls: string }> = {
  ATTENDING: { label: '참석', cls: 'badgeAttending' },
  NOT_ATTENDING: { label: '불참', cls: 'badgeNotAttending' },
  MAYBE: { label: '미정', cls: 'badgeMaybe' },
};

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

  return (
    <div className={styles.tableWrap}>
      <div className={styles.table}>
        <div className={styles.headRow}>
          <div>하객</div>
          <div>상태</div>
          <div>인원</div>
          <div>연락처</div>
          <div>등록일</div>
          <div />
        </div>

        {attendances.map((a) => {
          const meta = STATUS_META[a.attendanceStatus] ?? { label: a.attendanceStatus, cls: '' };
          return (
            <div key={a.id} className={styles.bodyRow}>
              <div className={styles.guestCell}>
                <div className={styles.avatar}>{(a.guestName || '').slice(0, 1)}</div>
                <div className={styles.guestText}>
                  <div className={styles.guestName}>{a.guestName}</div>
                  {a.message && <div className={styles.guestMessage}>"{a.message}"</div>}
                </div>
              </div>
              <div>
                <span className={cn(styles.badge, styles[meta.cls])}>
                  <span className={styles.badgeDot} />
                  {meta.label}
                </span>
              </div>
              <div className={styles.countCell}>{a.guestCount}명</div>
              <div className={styles.phoneCell}>{a.phoneNumber || '-'}</div>
              <div className={styles.dateCell}>{new Date(a.createdAt).toLocaleDateString('ko-KR')}</div>
              <div className={styles.deleteCell}>
                <button
                  onClick={() => {
                    if (confirm('정말 삭제하시겠습니까?')) onDelete(a.id);
                  }}
                  className={styles.deleteButton}
                  title="삭제"
                >
                  ✕
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
