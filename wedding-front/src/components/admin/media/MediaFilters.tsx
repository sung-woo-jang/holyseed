import styles from './MediaFilters.module.css';
import cn from 'classnames';

interface MediaFiltersProps {
  current: 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED';
  onChange: (filter: 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED') => void;
  stats?: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
}

export function MediaFilters({ current, onChange, stats }: MediaFiltersProps) {
  const tabs = [
    { key: 'ALL' as const, label: '전체', count: stats?.total },
    { key: 'PENDING' as const, label: '승인 대기', count: stats?.pending },
    { key: 'APPROVED' as const, label: '승인됨', count: stats?.approved },
    { key: 'REJECTED' as const, label: '거부됨', count: stats?.rejected },
  ];

  return (
    <div className={styles.container}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={cn(styles.filterButton, { [styles.active]: current === tab.key })}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className={styles.count}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
