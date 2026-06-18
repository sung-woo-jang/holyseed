import { useState } from 'react';
import type { Media } from '@/shared/types';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import styles from './MediaCard.module.css';
import cn from 'classnames';

interface MediaCardProps {
  media: Media;
  onModerate: (id: string, status: 'APPROVED' | 'REJECTED') => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function MediaCard({ media, onModerate, onDelete }: MediaCardProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleModerate = async (status: 'APPROVED' | 'REJECTED') => {
    setIsProcessing(true);
    try {
      await onModerate(media.id, status);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    setIsProcessing(true);
    try {
      await onDelete(media.id);
      setShowDeleteModal(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = () => {
    switch (media.moderationStatus) {
      case 'PENDING':
        return <span className={cn(styles.badge, styles.badgePending)}>승인 대기</span>;
      case 'APPROVED':
        return <span className={cn(styles.badge, styles.badgeApproved)}>승인됨</span>;
      case 'REJECTED':
        return <span className={cn(styles.badge, styles.badgeRejected)}>거부됨</span>;
      default:
        return null;
    }
  };

  return (
    <div className={styles.card}>
      {/* Thumbnail */}
      <div className={styles.mediaContainer}>
        {media.localThumbnailPath && (
          <img
            src={`/api/wedding/media/${media.id}/thumbnail`}
            alt={media.uploaderName || 'Guest photo'}
            className={styles.image}
            style={{ objectFit: 'cover', width: '100%', height: '100%' }}
          />
        )}
        {/* Status Badge */}
        {getStatusBadge()}
      </div>

      {/* Info */}
      <div className={styles.info}>
        <div className={styles.uploader}>
          {media.uploaderName || '익명'}
        </div>
        <div className={styles.message}>
          {media.message || '메시지 없음'}
        </div>
        <div className={styles.meta}>
          <span className={styles.metaItem}>
            {formatFileSize(media.fileSize)} • {media.width}×{media.height}
          </span>
          <span className={styles.metaItem}>
            {new Date(media.createdAt).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        <button
          onClick={() => handleModerate('APPROVED')}
          disabled={isProcessing || media.moderationStatus === 'APPROVED'}
          className={cn(styles.button, styles.buttonApprove)}
        >
          승인
        </button>
        <button
          onClick={() => handleModerate('REJECTED')}
          disabled={isProcessing || media.moderationStatus === 'REJECTED'}
          className={cn(styles.button, styles.buttonReject)}
        >
          거부
        </button>
      </div>

      {/* Delete Button */}
      <div className={styles.footer}>
        <button
          onClick={() => setShowDeleteModal(true)}
          disabled={isProcessing}
          className={styles.buttonDelete}
        >
          영구 삭제
        </button>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <DeleteConfirmModal
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteModal(false)}
          isProcessing={isProcessing}
        />
      )}
    </div>
  );
}

function formatFileSize(bytes: number): string {
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)}KB`;
  return `${(kb / 1024).toFixed(1)}MB`;
}
