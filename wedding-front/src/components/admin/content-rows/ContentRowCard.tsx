import type { ContentRow } from '@/types';
import { ContentItem } from '@/types';
import styles from './ContentRowCard.module.css';

interface ContentRowCardProps {
  row: ContentRow;
  onEdit: (row: ContentRow) => void;
  onDelete: (id: string) => void;
}

const ROW_TYPE_LABELS: Record<string, string> = {
  TOP_RANKED: 'TOP 5 랭킹',
  IMAGE_GALLERY: '이미지 갤러리',
  VIDEO_GALLERY: '비디오 갤러리',
};

export function ContentRowCard({ row, onEdit, onDelete }: ContentRowCardProps) {
  const items = row.items as unknown as ContentItem[];
  const firstItem = items[0];

  return (
    <div className={styles.card}>
      {/* Thumbnail */}
      <div className={styles.thumbnail}>
        {firstItem?.src ? (
          firstItem.type === 'video' ? (
            <video
              src={firstItem.src}
              poster={firstItem.poster}
              className={styles.thumbnailImage}
            />
          ) : (
            <img
              src={firstItem.src}
              alt={firstItem.alt}
              className={styles.thumbnailImage}
              style={{ objectFit: 'cover', width: '100%', height: '100%' }}
            />
          )
        ) : (
          <div className={styles.thumbnailPlaceholder}>
            <span>이미지 없음</span>
          </div>
        )}
        {!row.isVisible && (
          <div className={styles.hiddenBadge}>숨김</div>
        )}
      </div>

      {/* Info */}
      <div className={styles.info}>
        <h3 className={styles.title}>{row.title}</h3>
        <div className={styles.meta}>
          <span className={styles.type}>
            {ROW_TYPE_LABELS[row.rowType] || row.rowType}
          </span>
          <span className={styles.itemCount}>
            아이템 {items.length}개
          </span>
          <span className={styles.order}>
            순서: {row.order}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        <button
          className={styles.editButton}
          onClick={() => onEdit(row)}
        >
          편집
        </button>
        <button
          className={styles.deleteButton}
          onClick={() => onDelete(row.id)}
        >
          삭제
        </button>
      </div>
    </div>
  );
}
