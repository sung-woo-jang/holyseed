import styles from './MediaStats.module.css';
import cn from 'classnames';

interface MediaStatsProps {
  stats?: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
}

export function MediaStats({ stats }: MediaStatsProps) {
  if (!stats) return null;

  const items = [
    { label: '전체 미디어', value: stats.total, type: 'default' },
    { label: '승인 대기', value: stats.pending, type: 'pending' },
    { label: '승인됨', value: stats.approved, type: 'approved' },
    { label: '거부됨', value: stats.rejected, type: 'rejected' },
  ];

  return (
    <div className={styles.container}>
      {items.map((item) => (
        <div
          key={item.label}
          className={styles.statCard}
          data-stat-type={item.type}
        >
          <dt className={styles.label}>
            {item.label}
          </dt>
          <dd className={styles.value}>
            {item.value}
          </dd>
        </div>
      ))}
    </div>
  );
}
