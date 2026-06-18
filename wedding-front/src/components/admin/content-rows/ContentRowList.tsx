import { ContentRow } ;
import { ContentRowCard } from './ContentRowCard';
import styles from './ContentRowList.module.css';

interface ContentRowListProps {
  rows: ContentRow[];
  onEdit: (row: ContentRow) => void;
  onDelete: (id: string) => void;
}

export function ContentRowList({ rows, onEdit, onDelete }: ContentRowListProps) {
  if (rows.length === 0) {
    return (
      <div className={styles.empty}>
        <p>아직 생성된 콘텐츠 Row가 없습니다.</p>
        <p>위의 "+ 새 Row 추가" 버튼을 클릭하여 시작하세요.</p>
      </div>
    );
  }

  return (
    <div className={styles.grid}>
      {rows.map((row) => (
        <ContentRowCard
          key={row.id}
          row={row}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
