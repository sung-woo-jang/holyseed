import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import type { Media } from '@/types';
import { ContentRowType, ContentItem } from '@/types';
import { MediaUploader } from './MediaUploader';
import styles from './MediaSelector.module.css';

interface MediaSelectorProps {
  coupleId: string;
  rowType: ContentRowType;
  onSelect: (items: ContentItem[]) => void;
  onClose: () => void;
}

export function MediaSelector({ coupleId, rowType, onSelect, onClose }: MediaSelectorProps) {
  const [activeTab, setActiveTab] = useState<'existing' | 'upload'>('existing');
  const [media, setMedia] = useState<Media[]>([]);
  const [selectedMediaIds, setSelectedMediaIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMedia();
  }, [coupleId]);

  const fetchMedia = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await api.post('/media/search', { coupleId, moderationStatus: 'APPROVED', limit: 100 });
      setMedia(res.data.data?.media ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load media');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSelection = (mediaId: string) => {
    setSelectedMediaIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(mediaId)) {
        newSet.delete(mediaId);
      } else {
        if (rowType === 'TOP_RANKED' && newSet.size >= 5) {
          alert('TOP 5 랭킹은 최대 5개까지만 선택할 수 있습니다.');
          return prev;
        }
        newSet.add(mediaId);
      }
      return newSet;
    });
  };

  const handleConfirmSelection = () => {
    const selectedMedia = media.filter((m) => selectedMediaIds.has(m.id));

    const items: ContentItem[] = selectedMedia.map((m, index) => {
      const baseItem = {
        src: `/api/wedding/media/${m.id}/resized`,
        alt: m.uploaderName || 'Image',
        order: index,
        mediaId: m.id,
      };

      if (rowType === 'TOP_RANKED') {
        return { ...baseItem, type: 'top-ranked' as const, rank: index + 1 };
      } else if (rowType === 'VIDEO_GALLERY' && m.fileType.startsWith('video/')) {
        return { ...baseItem, type: 'video' as const, poster: `/api/wedding/media/${m.id}/thumbnail` };
      } else {
        return { ...baseItem, type: 'image' as const };
      }
    });

    onSelect(items);
  };

  const handleUploadComplete = async (mediaIds: string[]) => {
    if (mediaIds.length === 0) return;

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const res = await api.post('/media/search', { coupleId, moderationStatus: 'APPROVED', limit: 100 });
      const allMedia: Media[] = res.data.data?.media ?? [];

      const uploadedMedia = allMedia.filter((m) => mediaIds.includes(m.id));

      if (uploadedMedia.length === 0) {
        alert('업로드한 미디어를 찾을 수 없습니다. 잠시 후 다시 시도해주세요.');
        return;
      }

      const items: ContentItem[] = uploadedMedia.map((m, index) => {
        const src = `/api/wedding/media/${m.id}/resized`;
        const baseItem = { src, alt: m.uploaderName || 'Image', order: index, mediaId: m.id };

        if (rowType === 'TOP_RANKED') {
          return { ...baseItem, type: 'top-ranked' as const, rank: index + 1 };
        } else if (rowType === 'VIDEO_GALLERY' && m.fileType.startsWith('video/')) {
          return { ...baseItem, type: 'video' as const, poster: `/api/wedding/media/${m.id}/thumbnail` };
        } else {
          return { ...baseItem, type: 'image' as const };
        }
      });

      onSelect(items);
    } catch (error) {
      console.error('Failed to process uploaded media:', error);
      alert('업로드는 성공했지만 미디어 처리 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className={styles.modal}>
      <div className={styles.modalContent}>
        <div className={styles.header}>
          <h3>미디어 선택</h3>
          <button type="button" className={styles.closeButton} onClick={onClose}>×</button>
        </div>

        <div className={styles.tabs}>
          <button type="button" className={`${styles.tab} ${activeTab === 'existing' ? styles.activeTab : ''}`} onClick={() => setActiveTab('existing')}>
            기존 미디어 선택
          </button>
          <button type="button" className={`${styles.tab} ${activeTab === 'upload' ? styles.activeTab : ''}`} onClick={() => setActiveTab('upload')}>
            새 미디어 업로드
          </button>
        </div>

        <div className={styles.tabContent}>
          {activeTab === 'existing' && (
            <div>
              {error && <div className={styles.error}>{error}</div>}

              {isLoading ? (
                <p>로딩 중...</p>
              ) : media.length === 0 ? (
                <div className={styles.empty}>
                  <p>승인된 미디어가 없습니다.</p>
                  <p>새 미디어를 업로드해주세요.</p>
                </div>
              ) : (
                <>
                  <p className={styles.hint}>
                    {rowType === 'TOP_RANKED' ? '최대 5개까지 선택 가능합니다.' : '원하는 미디어를 선택하세요.'}
                  </p>

                  <div className={styles.mediaGrid}>
                    {media.map((m) => (
                      <div
                        key={m.id}
                        className={`${styles.mediaItem} ${selectedMediaIds.has(m.id) ? styles.selected : ''}`}
                        onClick={() => toggleSelection(m.id)}
                      >
                        {m.fileType.startsWith('video/') ? (
                          <video
                            src={`/api/wedding/media/${m.id}/original`}
                            className={styles.mediaThumbnail}
                          />
                        ) : (
                          <img
                            src={`/api/wedding/media/${m.id}/thumbnail`}
                            alt={m.uploaderName || 'Media'}
                            className={styles.mediaThumbnail}
                            style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                          />
                        )}
                        {selectedMediaIds.has(m.id) && (
                          <div className={styles.checkmark}>✓</div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'upload' && (
            <MediaUploader
              coupleId={coupleId}
              rowType={rowType}
              onComplete={handleUploadComplete}
            />
          )}
        </div>

        <div className={styles.footer}>
          <button type="button" className={styles.cancelButton} onClick={onClose}>취소</button>
          {activeTab === 'existing' && (
            <button
              type="button"
              className={styles.confirmButton}
              onClick={handleConfirmSelection}
              disabled={selectedMediaIds.size === 0}
            >
              선택 완료 ({selectedMediaIds.size}개)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
