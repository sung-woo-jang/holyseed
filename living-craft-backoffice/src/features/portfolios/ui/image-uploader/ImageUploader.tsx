import { useCallback, useRef, useState } from 'react'
import { X, Plus, ImageIcon } from 'lucide-react'
import styles from './styles.module.scss'

interface ImageUploaderProps {
  existingImages: string[]
  newImages: File[]
  onExistingImagesChange: (images: string[]) => void
  onNewImagesChange: (files: File[]) => void
  maxImages?: number
}

export function ImageUploader({
  existingImages,
  newImages,
  onExistingImagesChange,
  onNewImagesChange,
  maxImages = 10,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const totalImages = existingImages.length + newImages.length
  const canAddMore = totalImages < maxImages

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || [])
      const imageFiles = files.filter((file) => file.type.startsWith('image/'))
      const remainingSlots = maxImages - totalImages
      const filesToAdd = imageFiles.slice(0, remainingSlots)
      onNewImagesChange([...newImages, ...filesToAdd])
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    },
    [newImages, totalImages, maxImages, onNewImagesChange]
  )

  const handleRemoveExisting = useCallback(
    (index: number) => {
      const updated = existingImages.filter((_, i) => i !== index)
      onExistingImagesChange(updated)
    },
    [existingImages, onExistingImagesChange]
  )

  const handleRemoveNew = useCallback(
    (index: number) => {
      const updated = newImages.filter((_, i) => i !== index)
      onNewImagesChange(updated)
    },
    [newImages, onNewImagesChange]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const files = Array.from(e.dataTransfer.files).filter((f) =>
        f.type.startsWith('image/')
      )
      const remainingSlots = maxImages - totalImages
      const filesToAdd = files.slice(0, remainingSlots)
      onNewImagesChange([...newImages, ...filesToAdd])
    },
    [newImages, totalImages, maxImages, onNewImagesChange]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  return (
    <div className={styles.container}>
      {/* 이미지 그리드 */}
      <div className={styles.imageGrid}>
        {/* 기존 이미지 */}
        {existingImages.map((url, index) => (
          <div key={`existing-${index}`} className={styles.imageItem}>
            <img src={url} alt={`이미지 ${index + 1}`} />
            <button
              type='button'
              className={styles.removeButton}
              onClick={() => handleRemoveExisting(index)}
              aria-label='이미지 삭제'
            >
              <X className='size-4' />
            </button>
          </div>
        ))}

        {/* 새 이미지 */}
        {newImages.map((file, index) => (
          <div key={`new-${index}`} className={styles.imageItem}>
            <img
              src={URL.createObjectURL(file)}
              alt={`새 이미지 ${index + 1}`}
            />
            <button
              type='button'
              className={styles.removeButton}
              onClick={() => handleRemoveNew(index)}
              aria-label='이미지 삭제'
            >
              <X className='size-4' />
            </button>
            <span className={styles.newBadge}>NEW</span>
          </div>
        ))}

        {/* 추가 버튼 */}
        {canAddMore && (
          <div
            className={`${styles.addButton} ${isDragging ? styles.dragging : ''}`}
            onClick={() => inputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            role='button'
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                inputRef.current?.click()
              }
            }}
          >
            <Plus className='size-6' />
            <span>이미지 추가</span>
          </div>
        )}
      </div>

      {/* 드래그 앤 드롭 영역 (이미지가 없을 때) */}
      {totalImages === 0 && (
        <div
          className={`${styles.dropZone} ${isDragging ? styles.dragging : ''}`}
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          role='button'
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              inputRef.current?.click()
            }
          }}
        >
          <ImageIcon className='text-muted-foreground size-12' />
          <p className={styles.dropZoneText}>
            이미지를 드래그하여 놓거나 클릭하여 선택하세요
          </p>
          <p className={styles.dropZoneHint}>
            PNG, JPG, GIF 파일 (최대 {maxImages}개)
          </p>
        </div>
      )}

      <input
        ref={inputRef}
        type='file'
        accept='image/*'
        multiple
        className={styles.hiddenInput}
        onChange={handleFileSelect}
      />

      <p className={styles.hint}>
        {totalImages}/{maxImages}개 업로드됨
      </p>
    </div>
  )
}
