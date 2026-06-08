import { useRef, useState, useCallback, useEffect } from 'react'
import { Upload, Download, X, ImageIcon, FileArchive } from 'lucide-react'
import JSZip from 'jszip'

interface BaseImage {
  id: string
  url: string
  name: string
  naturalWidth: number
  naturalHeight: number
  size: number
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function getMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase()
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg'
  if (ext === 'webp') return 'image/webp'
  return 'image/png'
}

function isQualitySupported(mime: string): boolean {
  return mime === 'image/jpeg' || mime === 'image/webp'
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}

function canvasToBlob(canvas: HTMLCanvasElement, mime: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('toBlob failed'))),
      mime,
      quality,
    )
  })
}

async function resizeToCanvas(
  canvas: HTMLCanvasElement,
  srcUrl: string,
  maxWidth: number,
): Promise<{ srcW: number; srcH: number; dstW: number; dstH: number }> {
  const ctx = canvas.getContext('2d')!
  const img = await loadImage(srcUrl)
  const srcW = img.naturalWidth
  const srcH = img.naturalHeight
  const scale = srcW > maxWidth ? maxWidth / srcW : 1
  const dstW = Math.round(srcW * scale)
  const dstH = Math.round(srcH * scale)
  canvas.width = dstW
  canvas.height = dstH
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, 0, 0, dstW, dstH)
  return { srcW, srcH, dstW, dstH }
}

export default function ResizePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const offscreenRef = useRef<HTMLCanvasElement>(document.createElement('canvas'))
  const [images, setImages] = useState<BaseImage[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [maxWidth, setMaxWidth] = useState(1200)
  const [quality, setQuality] = useState(85)
  const [downloading, setDownloading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [sizeInfo, setSizeInfo] = useState<{ srcW: number; srcH: number; dstW: number; dstH: number } | null>(null)
  const [estSize, setEstSize] = useState<number | null>(null)

  const selectedImage = images.find((img) => img.id === selectedId) ?? null

  const renderPreview = useCallback(async () => {
    if (!selectedImage || !canvasRef.current) return
    const info = await resizeToCanvas(canvasRef.current, selectedImage.url, maxWidth)
    setSizeInfo(info)
    setEstSize(null)
    const mime = getMimeType(selectedImage.name)
    const q = isQualitySupported(mime) ? quality / 100 : undefined
    const blob = await canvasToBlob(canvasRef.current, mime, q)
    setEstSize(blob.size)
  }, [selectedImage, maxWidth, quality])

  useEffect(() => {
    if (selectedImage) renderPreview()
  }, [renderPreview])

  function addFiles(files: FileList | File[]) {
    const promises = Array.from(files)
      .filter((f) => f.type.startsWith('image/'))
      .map(
        (f) =>
          new Promise<BaseImage>((resolve) => {
            const url = URL.createObjectURL(f)
            const fileSize = f.size
            loadImage(url).then((img) => {
              resolve({
                id: crypto.randomUUID(),
                url,
                name: f.name,
                naturalWidth: img.naturalWidth,
                naturalHeight: img.naturalHeight,
                size: fileSize,
              })
            })
          }),
      )
    Promise.all(promises).then((newImages) => {
      if (newImages.length === 0) return
      setImages((prev) => {
        const next = [...prev, ...newImages]
        if (!selectedId) setSelectedId(newImages[0].id)
        return next
      })
    })
  }

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) addFiles(e.target.files)
    e.target.value = ''
  }

  function removeImage(id: string) {
    setImages((prev) => {
      const next = prev.filter((img) => img.id !== id)
      if (selectedId === id) {
        setSelectedId(next.length > 0 ? next[0].id : null)
      }
      return next
    })
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    addFiles(e.dataTransfer.files)
  }

  async function downloadOne(img: BaseImage) {
    const mime = getMimeType(img.name)
    await resizeToCanvas(offscreenRef.current, img.url, maxWidth)
    const q = isQualitySupported(mime) ? quality / 100 : undefined
    const dataUrl = offscreenRef.current.toDataURL(mime, q)
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = img.name
    a.click()
  }

  async function downloadSelected() {
    if (!selectedImage) return
    await downloadOne(selectedImage)
  }

  async function downloadAll() {
    if (images.length === 0) return
    setDownloading(true)
    const zip = new JSZip()
    for (const img of images) {
      const mime = getMimeType(img.name)
      await resizeToCanvas(offscreenRef.current, img.url, maxWidth)
      const q = isQualitySupported(mime) ? quality / 100 : undefined
      const base64 = offscreenRef.current.toDataURL(mime, q).split(',')[1]
      zip.file(img.name, base64, { base64: true })
    }
    const blob = await zip.generateAsync({ type: 'blob' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'resized.zip'
    a.click()
    setDownloading(false)
  }

  const selectedMime = selectedImage ? getMimeType(selectedImage.name) : null

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 24, alignItems: 'start' }}>
      {/* 컨트롤 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* 이미지 업로드 */}
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>원본 이미지</span>
            {images.length > 0 && (
              <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>{images.length}장</span>
            )}
          </div>
          <label
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              border: `2px dashed ${dragOver ? '#3b82f6' : 'var(--gray-300)'}`,
              borderRadius: 8,
              height: 88,
              cursor: 'pointer',
              backgroundColor: dragOver ? 'rgba(59,130,246,0.05)' : 'transparent',
              transition: 'border-color 0.15s',
              gap: 4,
            }}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <Upload size={18} color="var(--gray-400)" />
            <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>클릭 또는 드래그&드롭 (다중 선택)</span>
            <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleInput} />
          </label>

          {images.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 12, maxHeight: 240, overflowY: 'auto' }}>
              {images.map((img) => (
                <div
                  key={img.id}
                  onClick={() => setSelectedId(img.id)}
                  style={{
                    position: 'relative',
                    borderRadius: 8,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    border: `2px solid ${selectedId === img.id ? '#3b82f6' : 'transparent'}`,
                    aspectRatio: '1',
                    transition: 'border-color 0.15s',
                  }}
                >
                  <img src={img.url} alt={img.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button
                    onClick={(e) => { e.stopPropagation(); removeImage(img.id) }}
                    style={{
                      position: 'absolute',
                      top: 2,
                      right: 2,
                      background: 'rgba(0,0,0,0.6)',
                      border: 'none',
                      borderRadius: '50%',
                      width: 20,
                      height: 20,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                    }}
                  >
                    <X size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 설정 */}
        <div className="card" style={{ padding: 16 }}>
          <span style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>설정</span>

          {/* 최대 폭 */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 14 }}>
              <span style={{ color: 'var(--gray-500)' }}>최대 폭</span>
              <span style={{ fontFamily: 'monospace' }}>{maxWidth}px</span>
            </div>
            <input
              type="number"
              min={1}
              max={9999}
              value={maxWidth}
              onChange={(e) => setMaxWidth(Math.max(1, Number(e.target.value)))}
              style={{
                width: '100%',
                padding: '8px 10px',
                border: '1px solid var(--gray-300)',
                borderRadius: 6,
                fontSize: 14,
                fontFamily: 'monospace',
                boxSizing: 'border-box',
              }}
            />
            <p style={{ fontSize: 11, color: 'var(--gray-400)', margin: '4px 0 0' }}>원본보다 클 경우 원본 크기 유지</p>
          </div>

          {/* 품질 */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 14 }}>
              <span style={{ color: 'var(--gray-500)' }}>
                품질{selectedMime && !isQualitySupported(selectedMime) && (
                  <span style={{ fontSize: 11, color: 'var(--gray-400)', marginLeft: 4 }}>(PNG 무손실)</span>
                )}
              </span>
              <span style={{ fontFamily: 'monospace' }}>{quality}</span>
            </div>
            <input
              type="range"
              min={10}
              max={100}
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
              disabled={!!(selectedMime && !isQualitySupported(selectedMime))}
              style={{ width: '100%', accentColor: '#3b82f6' }}
            />
          </div>
        </div>

        {/* 다운로드 버튼 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            onClick={downloadSelected}
            disabled={!selectedImage}
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 0' }}
          >
            <Download size={16} />
            선택 이미지 다운로드
          </button>
          <button
            onClick={downloadAll}
            disabled={images.length === 0 || downloading}
            className="btn"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 0', background: '#059669', color: '#fff', border: 'none' }}
          >
            <FileArchive size={16} />
            {downloading ? 'ZIP 생성 중...' : `전체 ZIP 다운로드 (${images.length}장)`}
          </button>
        </div>
      </div>

      {/* 미리보기 */}
      <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 12 }}>
        {!selectedImage ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: 'var(--gray-300)' }}>
            <ImageIcon size={40} />
            <p style={{ fontSize: 14, margin: 0 }}>이미지를 업로드하면 미리보기가 표시됩니다</p>
          </div>
        ) : (
          <>
            {sizeInfo && (
              <div style={{ alignSelf: 'flex-start', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--gray-500)' }}>
                  {sizeInfo.srcW} × {sizeInfo.srcH}
                  {(sizeInfo.srcW !== sizeInfo.dstW || sizeInfo.srcH !== sizeInfo.dstH) ? (
                    <span style={{ color: '#3b82f6' }}> → {sizeInfo.dstW} × {sizeInfo.dstH}</span>
                  ) : (
                    <span style={{ color: 'var(--gray-400)' }}> (원본 유지)</span>
                  )}
                </div>
                {selectedImage && (
                  <div style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--gray-500)' }}>
                    {formatBytes(selectedImage.size)}
                    {estSize !== null ? (() => {
                      const ratio = 1 - estSize / selectedImage.size
                      return (
                        <>
                          <span style={{ color: '#3b82f6' }}> → 약 {formatBytes(estSize)}</span>
                          {ratio > 0.01 && (
                            <span style={{ color: '#059669', marginLeft: 4 }}>(-{(ratio * 100).toFixed(0)}%)</span>
                          )}
                          {ratio <= 0.01 && ratio >= -0.01 && (
                            <span style={{ color: 'var(--gray-400)', marginLeft: 4 }}>(동일)</span>
                          )}
                          {ratio < -0.01 && (
                            <span style={{ color: '#dc2626', marginLeft: 4 }}>(+{(Math.abs(ratio) * 100).toFixed(0)}%)</span>
                          )}
                        </>
                      )
                    })() : (
                      <span style={{ color: 'var(--gray-400)' }}> → 계산 중...</span>
                    )}
                  </div>
                )}
              </div>
            )}
            <canvas ref={canvasRef} style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 8 }} />
          </>
        )}
      </div>
    </div>
  )
}
