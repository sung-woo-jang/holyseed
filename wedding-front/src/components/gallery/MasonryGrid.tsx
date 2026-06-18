

import Masonry from 'react-masonry-css';
import { MediaCard } from './MediaCard';
import type { Media } from '@/types';
import styles from './MasonryGrid.module.css';

interface MasonryGridProps {
  media: Media[];
  onMediaClick: (index: number) => void;
}

export function MasonryGrid({ media, onMediaClick }: MasonryGridProps) {
  const breakpointColumns = {
    default: 4,
    1280: 3,  // xl
    1024: 2,  // lg
    640: 1,   // sm
  };

  return (
    <Masonry
      breakpointCols={breakpointColumns}
      className={styles.masonryGrid}
      columnClassName={styles.masonryColumn}
    >
      {media.map((item, index) => (
        <MediaCard
          key={item.id}
          media={item}
          onClick={() => onMediaClick(index)}
        />
      ))}
    </Masonry>
  );
}
