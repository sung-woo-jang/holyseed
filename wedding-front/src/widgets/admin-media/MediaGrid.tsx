import type { Media } from '@/shared/types';
import { MediaCard } from './MediaCard';
import styles from './MediaGrid.module.css';
import cn from 'classnames';

interface MediaGridProps {
  media?: Media[];
  isLoading: boolean;
  onModerate: (id: string, status: 'APPROVED' | 'REJECTED') => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function MediaGrid({
  media,
  isLoading,
  onModerate,
  onDelete,
}: MediaGridProps) {
  if (isLoading) {
    return (
      <div className={styles.grid}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className={styles.skeletonCard}>
            <div className={styles.skeletonMedia} />
            <div className={styles.skeletonContent}>
              <div className={cn(styles.skeletonLine, styles.skeletonTitle)} />
              <div className={cn(styles.skeletonLine, styles.skeletonDesc)} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!media || media.length === 0) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyText}>검색 결과에 맞는 미디어가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className={styles.grid}>
      {media.map((item) => (
        <MediaCard
          key={item.id}
          media={item}
          onModerate={onModerate}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
