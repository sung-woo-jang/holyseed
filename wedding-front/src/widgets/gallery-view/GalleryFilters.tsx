import styles from './GalleryFilters.module.css';
import cn from 'classnames';

interface GalleryFiltersProps {
  currentFilter: 'all' | 'image' | 'video';
  onFilterChange: (filter: 'all' | 'image' | 'video') => void;
  stats: {
    total: number;
    images: number;
    videos: number;
  };
}

export function GalleryFilters({ currentFilter, onFilterChange, stats }: GalleryFiltersProps) {
  const filters = [
    { value: 'all' as const, label: '전체', count: stats.total },
    { value: 'image' as const, label: '사진', count: stats.images },
    { value: 'video' as const, label: '동영상', count: stats.videos },
  ];

  return (
    <div className={styles.container}>
      {filters.map(filter => (
        <button
          key={filter.value}
          type="button"
          onClick={() => onFilterChange(filter.value)}
          className={cn(styles.chip, { [styles.chipActive]: currentFilter === filter.value })}
        >
          {filter.label} <span className={styles.count}>{filter.count}</span>
        </button>
      ))}
    </div>
  );
}
