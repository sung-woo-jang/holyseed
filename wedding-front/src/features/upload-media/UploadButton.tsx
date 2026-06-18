import { useState, useRef, DragEvent, ChangeEvent } from 'react';
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

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); };
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) uploadFiles(files);
  };

  const handleCancel = () => { cancelRef.current?.abort(); };

  return (
    <div className={styles.container}>
      <div
        className={cn(styles.dropzone, {
          [styles.dropzoneActive]: isDragging,
          [styles.dropzoneDisabled]: uploading,
        })}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
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

        <div className={styles.content}>
          {!uploading && !success && (
            <>
              <svg className={styles.icon} stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div>
                <button type="button" onClick={() => fileInputRef.current?.click()} className={styles.buttonSelect}>파일 선택</button>
              </div>
              <p className={styles.textMain}>또는 파일을 드래그 앤 드롭하세요</p>
              <p className={styles.textSub}>JPG, PNG, WEBP, MP4, MOV (최대 5GB)</p>
            </>
          )}

          {uploading && (
            <>
              <svg className={styles.spinner} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" style={{ opacity: 0.25 }} />
                <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" style={{ opacity: 0.75 }} />
              </svg>
              {totalFiles > 1 && <p className={styles.fileInfo}>{completedFiles + 1} / {totalFiles} 파일</p>}
              <p className={styles.fileInfo}>{currentFile}</p>
              <p className={styles.textSub}>업로드 중... {progress}%</p>
              <div className={styles.progressContainer}>
                <div className={styles.progressBar} style={{ width: `${progress}%` }} />
              </div>
              <button type="button" onClick={handleCancel} className={styles.buttonCancel}>취소</button>
            </>
          )}

          {success && (
            <>
              <svg className={styles.iconSuccess} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className={styles.textSuccess}>
                {totalFiles > 1 ? `${totalFiles}개 파일 업로드 완료!` : '업로드 완료!'}{' '}
                검토 후 갤러리에 표시됩니다.
              </p>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className={styles.errorContainer}>
          <p className={styles.errorMessage}>{error}</p>
          <button type="button" onClick={() => setError(null)} className={styles.buttonCloseError}>닫기</button>
        </div>
      )}
    </div>
  );
}
