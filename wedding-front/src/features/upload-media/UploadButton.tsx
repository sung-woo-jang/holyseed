import { useState, useRef, DragEvent, ChangeEvent, KeyboardEvent } from 'react';
import axios from 'axios';
import { api } from '@/shared/api';
import styles from './UploadButton.module.css';
import cn from 'classnames';

interface UploadButtonProps {
  coupleId: string;
  onUploadComplete?: (mediaId: string) => void;
  onUploadError?: (error: string) => void;
}

const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'video/mp4',
  'video/quicktime',
  'video/x-msvideo',
];

const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024; // 5GB

export default function UploadButton({
  coupleId,
  onUploadComplete,
  onUploadError,
}: UploadButtonProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [currentFile, setCurrentFile] = useState<string>('');
  const [totalFiles, setTotalFiles] = useState(0);
  const [completedFiles, setCompletedFiles] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cancelRef = useRef<AbortController | null>(null);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return `지원하지 않는 파일 형식입니다. 허용된 형식: JPG, PNG, WEBP, MP4, MOV`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `파일 크기가 너무 큽니다. 최대 크기: 5GB`;
    }
    if (file.size === 0) {
      return '파일이 비어있습니다.';
    }
    return null;
  };

  const uploadFile = async (file: File) => {
    setCurrentFile(file.name);
    setProgress(0);
    setError(null);

    const validationError = validateFile(file);
    if (validationError) throw new Error(validationError);

    const controller = new AbortController();
    cancelRef.current = controller;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('coupleId', coupleId);

    const res = await api.post('/media/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      signal: controller.signal,
      onUploadProgress: (e) => {
        if (e.total) setProgress(Math.round((e.loaded / e.total) * 100));
      },
    });

    const mediaId: string = res.data?.data?.id;
    setProgress(100);
    if (onUploadComplete) onUploadComplete(mediaId);
    setCompletedFiles((prev) => prev + 1);
  };

  const uploadFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    setUploading(true);
    setTotalFiles(fileArray.length);
    setCompletedFiles(0);
    setError(null);
    setSuccess(false);

    const errors: string[] = [];

    for (const file of fileArray) {
      try {
        await uploadFile(file);
      } catch (err) {
        if (axios.isCancel(err)) {
          errors.push(`${file.name}: 업로드 취소됨`);
          break;
        }
        const msg = err instanceof Error ? err.message : 'Upload failed';
        errors.push(`${file.name}: ${msg}`);
        if (onUploadError) onUploadError(msg);
      }
    }

    setUploading(false);
    cancelRef.current = null;

    if (errors.length > 0) {
      setError(`${errors.length}개 파일 업로드 실패:\n${errors.join('\n')}`);
    } else {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setProgress(0);
        setTotalFiles(0);
        setCompletedFiles(0);
        setCurrentFile('');
      }, 3000);
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) uploadFiles(files);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const openPicker = () => fileInputRef.current?.click();
  const handleCardKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openPicker();
    }
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); };
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) uploadFiles(files);
  };

  const handleCancel = () => { cancelRef.current?.abort(); };

  const isIdle = !uploading && !success;

  return (
    <div className={styles.container}>
      <div
        className={cn(styles.card, {
          [styles.cardActive]: isDragging,
          [styles.cardBusy]: !isIdle,
        })}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        role={isIdle ? 'button' : undefined}
        tabIndex={isIdle ? 0 : undefined}
        onClick={isIdle ? openPicker : undefined}
        onKeyDown={isIdle ? handleCardKeyDown : undefined}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_FILE_TYPES.join(',')}
          onChange={handleFileSelect}
          disabled={uploading}
          multiple
          style={{ display: 'none' }}
        />

        {isIdle && (
          <>
            <div className={styles.icon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
            </div>
            <div className={styles.copy}>
              <p className={styles.cardTitle}>새 장면 추가하기</p>
              <p className={styles.cardDesc}>사진 · 영상을 올리면 검토 후 갤러리에 걸려요 (최대 5GB)</p>
            </div>
            <div className={styles.arrow}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
            </div>
          </>
        )}

        {uploading && (
          <>
            <div className={styles.spinner} />
            <div className={styles.copy}>
              <p className={styles.cardTitle}>
                {totalFiles > 1 ? `${completedFiles + 1} / ${totalFiles} 업로드 중` : '업로드 중'}
              </p>
              <p className={styles.cardDesc}>{currentFile}</p>
              <div className={styles.progressTrack}>
                <div className={styles.progressFill} style={{ width: `${progress}%` }} />
              </div>
            </div>
            <span className={styles.progressPct}>{progress}%</span>
          </>
        )}

        {success && (
          <>
            <div className={styles.iconSuccess}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>
            </div>
            <div className={styles.copy}>
              <p className={styles.cardTitle}>{totalFiles > 1 ? `${totalFiles}개 업로드 완료` : '업로드 완료'}</p>
              <p className={styles.cardDesc}>검토 후 갤러리에 표시됩니다</p>
            </div>
          </>
        )}
      </div>

      {uploading && (
        <button type="button" onClick={handleCancel} className={styles.cancelLink}>업로드 취소</button>
      )}

      {error && (
        <div className={styles.errorPanel}>
          <p className={styles.errorText}>{error}</p>
          <button type="button" onClick={() => setError(null)} className={styles.errorClose}>닫기</button>
        </div>
      )}
    </div>
  );
}
