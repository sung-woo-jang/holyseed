import { useState, useEffect } from 'react';
import { api } from '@/shared/api';
import type { Media } from '@/shared/types';
import { ContentRowType, ContentItem } from '@/shared/types';
import { MediaUploader } from './MediaUploader';
import { DeleteConfirmModal } from '@/widgets/admin-media/DeleteConfirmModal';
import { useToast } from '@/shared/ui/toast';
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
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [rotatingId, setRotatingId] = useState<string | null>(null);
  const [cacheBust, setCacheBust] = useState<Record<string, number>>({});
  const [deleteMode, setDeleteMode] = useState(false);
  const [markedForDeleteIds, setMarkedForDeleteIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const toast = useToast();

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
    if (!selectedMediaIds.has(mediaId) && rowType === 'TOP_RANKED' && selectedMediaIds.size >= 12) {
      toast.info('TOP 랭킹은 최대 12개까지만 선택할 수 있습니다.');
      return;
    }
    setSelectedMediaIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(mediaId)) {
        newSet.delete(mediaId);
      } else {
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

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await api.post(`/media/${deletingId}/delete`);
      setMedia((prev) => prev.filter((m) => m.id !== deletingId));
      setSelectedMediaIds((prev) => {
        const next = new Set(prev);
        next.delete(deletingId);
        return next;
      });
      toast.success('미디어가 삭제되었습니다.');
      setDeletingId(null);
    } catch {
      toast.error('미디어 삭제에 실패했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRotate = async (mediaId: string) => {
    setRotatingId(mediaId);
    try {
      await api.post(`/media/${mediaId}/rotate`, { direction: 'cw' });
      // 썸네일 URL이 그대로라 브라우저 캐시(1년, immutable)를 그대로 쓰므로
      // 캐시 무효화용 쿼리스트링을 붙여서 강제로 다시 받아오게 함
      setCacheBust((prev) => ({ ...prev, [mediaId]: Date.now() }));
      toast.success('이미지를 회전했습니다.');
    } catch {
      toast.error('이미지 회전에 실패했습니다.');
    } finally {
      setRotatingId(null);
    }
  };

  const toggleMarkedForDelete = (mediaId: string) => {
    setMarkedForDeleteIds((prev) => {
      const next = new Set(prev);
      if (next.has(mediaId)) {
        next.delete(mediaId);
      } else {
        next.add(mediaId);
      }
      return next;
    });
  };

  const handleItemClick = (mediaId: string) => {
    if (deleteMode) {
      toggleMarkedForDelete(mediaId);
    } else {
      toggleSelection(mediaId);
    }
  };

  const handleToggleDeleteMode = () => {
    setDeleteMode((prev) => !prev);
    setMarkedForDeleteIds(new Set());
  };

  const handleBulkDeleteConfirm = async () => {
    const ids = Array.from(markedForDeleteIds);
    if (ids.length === 0) return;
    setIsDeleting(true);
    try {
      const results = await Promise.allSettled(ids.map((id) => api.post(`/media/${id}/delete`)));
      const succeededIds = ids.filter((_, i) => results[i].status === 'fulfilled');
      const failedCount = ids.length - succeededIds.length;

      setMedia((prev) => prev.filter((m) => !succeededIds.includes(m.id)));
      setSelectedMediaIds((prev) => {
        const next = new Set(prev);
        succeededIds.forEach((id) => next.delete(id));
        return next;
      });
      setMarkedForDeleteIds((prev) => {
        const next = new Set(prev);
        succeededIds.forEach((id) => next.delete(id));
        return next;
      });

      if (failedCount === 0) {
        toast.success(`${succeededIds.length}개의 미디어가 삭제되었습니다.`);
        setDeleteMode(false);
      } else {
        toast.error(`${succeededIds.length}개 삭제, ${failedCount}개 실패했습니다.`);
      }
    } finally {
      setIsDeleting(false);
      setShowBulkDeleteConfirm(false);
    }
  };

  const handleUploadComplete = async (mediaIds: string[]) => {
    if (mediaIds.length === 0) return;

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const res = await api.post('/media/search', { coupleId, moderationStatus: 'APPROVED', limit: 100 });
      const allMedia: Media[] = res.data.data?.media ?? [];

      const uploadedMedia = allMedia.filter((m) => mediaIds.includes(m.id));

      if (uploadedMedia.length === 0) {
        toast.error('업로드한 미디어를 찾을 수 없습니다. 잠시 후 다시 시도해주세요.');
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
      toast.error('업로드는 성공했지만 미디어 처리 중 오류가 발생했습니다.');
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
                  <div className={styles.toolbar}>
                    <p className={styles.hint}>
                      {deleteMode
                        ? '삭제할 사진을 선택하세요.'
                        : rowType === 'TOP_RANKED' ? '최대 12개까지 선택 가능합니다.' : '원하는 미디어를 선택하세요.'}
                    </p>
                    <button type="button" className={styles.deleteModeButton} onClick={handleToggleDeleteMode}>
                      {deleteMode ? '취소' : '여러 개 삭제'}
                    </button>
                  </div>

                  {deleteMode && (
                    <div className={styles.bulkBar}>
                      <span>{markedForDeleteIds.size}개 선택됨</span>
                      <button
                        type="button"
                        className={styles.bulkDeleteButton}
                        disabled={markedForDeleteIds.size === 0}
                        onClick={() => setShowBulkDeleteConfirm(true)}
                      >
                        선택 삭제
                      </button>
                    </div>
                  )}

                  <div className={styles.mediaGrid}>
                    {media.map((m) => {
                      const isMarked = markedForDeleteIds.has(m.id);
                      return (
                        <div
                          key={m.id}
                          className={`${styles.mediaItem} ${!deleteMode && selectedMediaIds.has(m.id) ? styles.selected : ''} ${deleteMode && isMarked ? styles.markedForDelete : ''}`}
                          onClick={() => handleItemClick(m.id)}
                        >
                          {m.fileType.startsWith('video/') ? (
                            <video
                              src={`/api/wedding/media/${m.id}/original`}
                              className={styles.mediaThumbnail}
                            />
                          ) : (
                            <img
                              src={`/api/wedding/media/${m.id}/thumbnail${cacheBust[m.id] ? `?v=${cacheBust[m.id]}` : ''}`}
                              alt={m.uploaderName || 'Media'}
                              className={styles.mediaThumbnail}
                              style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                            />
                          )}
                          {!deleteMode && selectedMediaIds.has(m.id) && (
                            <div className={styles.checkmark}>✓</div>
                          )}
                          {deleteMode && isMarked && (
                            <div className={styles.deleteCheckmark}>✓</div>
                          )}
                          {!deleteMode && (
                            <button
                              type="button"
                              className={styles.deleteButton}
                              title="영구 삭제"
                              onClick={(e) => { e.stopPropagation(); setDeletingId(m.id); }}
                            >
                              ✕
                            </button>
                          )}
                          {!deleteMode && !m.fileType.startsWith('video/') && (
                            <button
                              type="button"
                              className={styles.rotateButton}
                              title="시계 방향으로 90도 회전"
                              disabled={rotatingId === m.id}
                              onClick={(e) => { e.stopPropagation(); handleRotate(m.id); }}
                            >
                              {rotatingId === m.id ? '⋯' : '⟳'}
                            </button>
                          )}
                        </div>
                      );
                    })}
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

      {deletingId && (
        <DeleteConfirmModal
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeletingId(null)}
          isProcessing={isDeleting}
        />
      )}

      {showBulkDeleteConfirm && (
        <DeleteConfirmModal
          description={`선택한 ${markedForDeleteIds.size}개의 미디어를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
          onConfirm={handleBulkDeleteConfirm}
          onCancel={() => setShowBulkDeleteConfirm(false)}
          isProcessing={isDeleting}
        />
      )}
    </div>
  );
}
