

import { useState } from 'react';
import { api } from '@/shared/api';
import { ContentRowType } from '@/shared/types';
import styles from './MediaUploader.module.css';

interface MediaUploaderProps {
  coupleId: string;
  rowType: ContentRowType;
  onComplete: (mediaIds: string[]) => void;
}

interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'complete' | 'error';
  error?: string;
  mediaId?: string;
}

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];

export function MediaUploader({ coupleId, rowType, onComplete }: MediaUploaderProps) {
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const allowedTypes =
    rowType === 'VIDEO_GALLERY'
      ? ALLOWED_VIDEO_TYPES
      : ALLOWED_IMAGE_TYPES;

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);

    // Validate files
    const validFiles = fileArray.filter((file) => {
      if (!allowedTypes.includes(file.type)) {
        alert(`${file.name}: 지원하지 않는 파일 형식입니다.`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024 * 1024) {
        alert(`${file.name}: 파일 크기가 5GB를 초과합니다.`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    // Initialize upload progress
    const newUploads: UploadProgress[] = validFiles.map((file) => ({
      fileName: file.name,
      progress: 0,
      status: 'pending',
    }));

    setUploads(newUploads);

    // Upload files
    const uploadPromises = validFiles.map((file, index) =>
      uploadFile(file, index)
    );

    const results = await Promise.all(uploadPromises);
    const successfulMediaIds = results
      .filter((r) => r !== null)
      .map((r) => r!);

    if (successfulMediaIds.length > 0) {
      onComplete(successfulMediaIds);
    }
  };

  const uploadFile = async (file: File, index: number): Promise<string | null> => {
    console.log('🔵 [CLIENT] Starting upload:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      coupleId,
      index
    });

    try {
      // Update status to uploading
      updateUploadStatus(index, { status: 'uploading', progress: 0 });

      // Upload directly through server
      const formData = new FormData();
      formData.append('file', file);
      formData.append('coupleId', coupleId);
      formData.append('uploaderName', 'Admin');

      console.log('🔵 [CLIENT] FormData created, sending request...');

      const res = await api.post('/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (e.total) {
            const progress = Math.round((e.loaded / e.total) * 100);
            updateUploadStatus(index, { progress });
          }
        },
      });

      const mediaId: string = res.data?.data?.id;

      // Update status to complete
      updateUploadStatus(index, { status: 'complete', mediaId, progress: 100 });
      return mediaId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      updateUploadStatus(index, {
        status: 'error',
        error: errorMessage,
      });
      return null;
    }
  };

  const updateUploadStatus = (
    index: number,
    update: Partial<UploadProgress>
  ) => {
    setUploads((prev) => {
      const newUploads = [...prev];
      newUploads[index] = { ...newUploads[index], ...update };
      return newUploads;
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const statusLabels = {
    pending: '대기 중',
    uploading: '업로드 중',
    processing: '처리 중',
    complete: '완료',
    error: '실패',
  };

  return (
    <div className={styles.container}>
      <div
        className={`${styles.dropZone} ${isDragging ? styles.dragging : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <p className={styles.dropZoneText}>
          파일을 드래그하거나 클릭하여 선택하세요
        </p>
        <p className={styles.dropZoneHint}>
          {rowType === 'VIDEO_GALLERY'
            ? '비디오 파일 (MP4, MOV) - 최대 5GB'
            : '이미지 파일 (JPG, PNG, WebP) - 최대 5GB'}
        </p>
        <input
          type="file"
          multiple
          accept={allowedTypes.join(',')}
          onChange={(e) => handleFileSelect(e.target.files)}
          className={styles.fileInput}
        />
      </div>

      {uploads.length > 0 && (
        <div className={styles.uploadList}>
          <h4>업로드 진행 상황</h4>
          {uploads.map((upload, index) => (
            <div key={index} className={styles.uploadItem}>
              <div className={styles.uploadInfo}>
                <span className={styles.fileName}>{upload.fileName}</span>
                <span
                  className={`${styles.status} ${styles[`status${upload.status}`]}`}
                >
                  {statusLabels[upload.status]}
                </span>
              </div>

              {upload.status === 'uploading' && (
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${upload.progress}%` }}
                  />
                </div>
              )}

              {upload.error && (
                <p className={styles.error}>{upload.error}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
