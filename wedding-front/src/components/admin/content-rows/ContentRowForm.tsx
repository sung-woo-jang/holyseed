import { useState } from 'react';
import { api } from '@/lib/api';
import type { ContentRow, ContentRowType } from '@/types';
import { ContentItem } from '@/types';
import { MediaSelector } from './MediaSelector';
import styles from './ContentRowForm.module.css';

interface ContentRowFormProps {
  coupleId: string;
  row?: ContentRow | null;
  onSubmit: () => void;
  onCancel: () => void;
}

const ROW_TYPE_OPTIONS: { value: ContentRowType; label: string; description: string }[] = [
  {
    value: 'TOP_RANKED',
    label: 'TOP 5 랭킹',
    description: '큰 숫자 오버레이가 있는 랭킹 갤러리 (최대 5개)',
  },
  {
    value: 'IMAGE_GALLERY',
    label: '이미지 갤러리',
    description: '일반 이미지 갤러리',
  },
  {
    value: 'VIDEO_GALLERY',
    label: '비디오 갤러리',
    description: '비디오 컬렉션',
  },
];

export function ContentRowForm({ coupleId, row, onSubmit, onCancel }: ContentRowFormProps) {
  const [title, setTitle] = useState(row?.title || '');
  const [rowType, setRowType] = useState<ContentRowType>(row?.rowType || 'IMAGE_GALLERY');
  const [items, setItems] = useState<ContentItem[]>((row?.items as unknown as ContentItem[]) || []);
  const [order, setOrder] = useState(row?.order || 0);
  const [isVisible, setIsVisible] = useState(row?.isVisible ?? true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMediaSelector, setShowMediaSelector] = useState(false);

  const isEditing = !!row;

  const handleAddItems = (newItems: ContentItem[]) => {
    setItems((prev) => {
      const maxOrder = prev.reduce((max, item) => Math.max(max, item.order), -1);
      return [
        ...prev,
        ...newItems.map((item, index) => ({
          ...item,
          order: maxOrder + index + 1,
        })),
      ];
    });
    setShowMediaSelector(false);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('제목을 입력해주세요.');
      return;
    }

    if (rowType === 'TOP_RANKED' && items.length > 5) {
      setError('TOP 5 랭킹은 최대 5개의 아이템만 추가할 수 있습니다.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditing) {
        await api.post(`/content-rows/${row.id}/update`, { title, rowType, items, order, isVisible });
      } else {
        await api.post('/content-rows', { coupleId, title, rowType, items, order, isVisible });
      }
      onSubmit();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h2 className={styles.formTitle}>
        {isEditing ? 'Row 편집' : '새 Row 추가'}
      </h2>

      {error && <div className={styles.error}>{error}</div>}

      {/* Title */}
      <div className={styles.field}>
        <label className={styles.label}>
          제목 <span className={styles.required}>*</span>
        </label>
        <input
          type="text"
          className={styles.input}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="예: 오늘 대한민국 TOP 5 웨딩"
          required
        />
      </div>

      {/* Row Type */}
      <div className={styles.field}>
        <label className={styles.label}>
          타입 <span className={styles.required}>*</span>
        </label>
        <div className={styles.radioGroup}>
          {ROW_TYPE_OPTIONS.map((option) => (
            <label key={option.value} className={styles.radioOption}>
              <input
                type="radio"
                name="rowType"
                value={option.value}
                checked={rowType === option.value}
                onChange={(e) => setRowType(e.target.value as ContentRowType)}
              />
              <div>
                <div className={styles.radioLabel}>{option.label}</div>
                <div className={styles.radioDescription}>{option.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Items */}
      <div className={styles.field}>
        <label className={styles.label}>
          아이템 ({items.length}개)
          {rowType === 'TOP_RANKED' && <span className={styles.hint}> 최대 5개</span>}
        </label>

        {items.length > 0 && (
          <div className={styles.itemsGrid}>
            {items.map((item, index) => (
              <div key={index} className={styles.itemCard}>
                {item.type === 'video' ? (
                  <video
                    src={item.src}
                    poster={item.poster}
                    className={styles.itemThumbnail}
                  />
                ) : (
                  <img
                    src={item.src}
                    alt={item.alt}
                    className={styles.itemThumbnail}
                    style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                  />
                )}
                {item.type === 'top-ranked' && (
                  <div className={styles.rankBadge}>{item.rank}</div>
                )}
                <button
                  type="button"
                  className={styles.removeItemButton}
                  onClick={() => handleRemoveItem(index)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          className={styles.addItemButton}
          onClick={() => setShowMediaSelector(true)}
          disabled={rowType === 'TOP_RANKED' && items.length >= 5}
        >
          + 아이템 추가
        </button>

        {showMediaSelector && (
          <MediaSelector
            coupleId={coupleId}
            rowType={rowType}
            onSelect={handleAddItems}
            onClose={() => setShowMediaSelector(false)}
          />
        )}
      </div>

      {/* Order */}
      <div className={styles.field}>
        <label className={styles.label}>표시 순서</label>
        <input
          type="number"
          className={styles.input}
          value={order}
          onChange={(e) => setOrder(parseInt(e.target.value) || 0)}
          min="0"
        />
        <p className={styles.hint}>
          숫자가 작을수록 먼저 표시됩니다.
        </p>
      </div>

      {/* Visibility */}
      <div className={styles.field}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={isVisible}
            onChange={(e) => setIsVisible(e.target.checked)}
          />
          <span>페이지에 표시</span>
        </label>
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.cancelButton}
          onClick={onCancel}
          disabled={isSubmitting}
        >
          취소
        </button>
        <button
          type="submit"
          className={styles.submitButton}
          disabled={isSubmitting}
        >
          {isSubmitting ? '저장 중...' : isEditing ? '수정' : '생성'}
        </button>
      </div>
    </form>
  );
}
