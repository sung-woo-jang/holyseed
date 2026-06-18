

import styles from './AttendanceFilters.module.css';
import cn from 'classnames';

type AttendanceFilter = 'all' | 'ATTENDING' | 'NOT_ATTENDING' | 'MAYBE';

interface AttendanceFiltersProps {
  currentFilter: AttendanceFilter;
  onFilterChange: (filter: AttendanceFilter) => void;
  counts: {
    total: number;
    attending: number;
    notAttending: number;
    maybe: number;
  };
}

export function AttendanceFilters({ currentFilter, onFilterChange, counts }: AttendanceFiltersProps) {
  const filters = [
    { value: 'all' as const, label: '전체', count: counts.total },
    { value: 'ATTENDING' as const, label: '참석', count: counts.attending },
    { value: 'NOT_ATTENDING' as const, label: '불참', count: counts.notAttending },
    { value: 'MAYBE' as const, label: '미정', count: counts.maybe },
  ];

  return (
    <div className={styles.container}>
      {filters.map(filter => (
        <button
          key={filter.value}
          onClick={() => onFilterChange(filter.value)}
          className={cn(styles.button, {
            [styles.buttonActive]: currentFilter === filter.value,
            [styles.buttonInactive]: currentFilter !== filter.value,
          })}
        >
          <span>{filter.label}</span>
          <span className={styles.count}>{filter.count}</span>
        </button>
      ))}
    </div>
  );
}
