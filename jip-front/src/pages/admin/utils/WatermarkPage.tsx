import { useRef, useState, useCallback, useEffect } from 'react'
import { Upload, Download, X, ImageIcon, FileArchive } from 'lucide-react'
import JSZip from 'jszip'

type Position =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'middle-left'
  | 'center'
  | 'middle-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'

interface BaseImage {
  id: string
  url: string
  name: string
}

const POSITIONS: { id: Position; label: string }[][] = [
  [
    { id: 'top-left', label: '↖' },
    { id: 'top-center', label: '↑' },
    { id: 'top-right', label: '↗' },
  ],
  [
    { id: 'middle-left', label: '←' },
    { id: 'center', label: '●' },
    { id: 'middle-right', label: '→' },
  ],
  [
    { id: 'bottom-left', label: '↙' },
    { id: 'bottom-center', label: '↓' },
    { id: 'bottom-right', label: '↘' },
  ],
]

const PADDING = 20

function getWatermarkXY(
  pos: Position,
  canvasW: number,
  canvasH: number,
  wmW: number,
  wmH: number,
): { x: number; y: number } {
  const left = PADDING
  const centerX = (canvasW - wmW) / 2
  const right = canvasW - wmW - PADDING
  const top = PADDING
  const centerY = (canvasH - wmH) / 2
  const bottom = canvasH - wmH - PADDING

  const map: Record<Position, { x: number; y: number }> = {
    'top-left': { x: left, y: top },
    'top-center': { x: centerX, y: top },
    'top-right': { x: right, y: top },
    'middle-left': { x: left, y: centerY },
    center: { x: centerX, y: centerY },
    'middle-right': { x: right, y: centerY },
    'bottom-left': { x: left, y: bottom },
    'bottom-center': { x: centerX, y: bottom },
    'bottom-right': { x: right, y: bottom },
  }
  return map[pos]
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

async function compositeToCanvas(
  canvas: HTMLCanvasElement,
  baseUrl: string,
  wmUrl: string,
  position: Position,
  opacity: number,
  wmScale: number,
) {
  const ctx = canvas.getContext('2d')!
  const [base, wm] = await Promise.all([loadImage(baseUrl), loadImage(wmUrl)])

  canvas.width = base.naturalWidth
  canvas.height = base.naturalHeight

  ctx.drawImage(base, 0, 0)

  const wmW = (canvas.width * wmScale) / 100
  const wmH = (wm.naturalHeight / wm.naturalWidth) * wmW
  const { x, y } = getWatermarkXY(position, canvas.width, canvas.height, wmW, wmH)

  ctx.globalAlpha = opacity / 100
  ctx.drawImage(wm, x, y, wmW, wmH)
  ctx.globalAlpha = 1
}

export default function WatermarkPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const offscreenRef = useRef<HTMLCanvasElement>(document.createElement('canvas'))
  const [baseImages, setBaseImages] = useState<BaseImage[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [wmUrl, setWmUrl] = useState<string | null>(null)
  const [position, setPosition] = useState<Position>('bottom-right')
  const [opacity, setOpacity] = useState(80)
  const [wmScale, setWmScale] = useState(30)
  const [downloading, setDownloading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [wmDragOver, setWmDragOver] = useState(false)

  const selectedImage = baseImages.find((img) => img.id === selectedId) ?? null

  const renderPreview = useCallback(async () => {
    if (!selectedImage || !wmUrl || !canvasRef.current) return
    await compositeToCanvas(canvasRef.current, selectedImage.url, wmUrl, position, opacity, wmScale)
  }, [selectedImage, wmUrl, position, opacity, wmScale])

  useEffect(() => {
    if (selectedImage && wmUrl) renderPreview()
  }, [renderPreview])

  function addFiles(files: FileList | File[]) {
    const newImages: BaseImage[] = Array.from(files)
      .filter((f) => f.type.startsWith('image/'))
      .map((f) => ({
        id: crypto.randomUUID(),
        url: URL.createObjectURL(f),
        name: f.name,
      }))
    if (newImages.length === 0) return
    setBaseImages((prev) => {
      const next = [...prev, ...newImages]
      if (!selectedId) setSelectedId(newImages[0].id)
      return next
    })
  }

  function handleBaseInput(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) addFiles(e.target.files)
    e.target.value = ''
  }

  function handleWmInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setWmUrl(URL.createObjectURL(file))
    e.target.value = ''
  }

  function removeImage(id: string) {
    setBaseImages((prev) => {
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
    if (!wmUrl) return
    const mime = getMimeType(img.name)
    await compositeToCanvas(offscreenRef.current, img.url, wmUrl, position, opacity, wmScale)
    const a = document.createElement('a')
    a.href = offscreenRef.current.toDataURL(mime)
    a.download = img.name
    a.click()
  }

  async function downloadSelected() {
    if (!selectedImage || !wmUrl) return
    await downloadOne(selectedImage)
  }

  async function downloadAll() {
    if (!wmUrl || baseImages.length === 0) return
    setDownloading(true)
    const zip = new JSZip()
    for (const img of baseImages) {
      const mime = getMimeType(img.name)
      await compositeToCanvas(offscreenRef.current, img.url, wmUrl, position, opacity, wmScale)
      const base64 = offscreenRef.current.toDataURL(mime).split(',')[1]
      zip.file(img.name, base64, { base64: true })
    }
    const blob = await zip.generateAsync({ type: 'blob' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'watermarked.zip'
    a.click()
    setDownloading(false)
  }

  const canDownload = !!selectedImage && !!wmUrl
  const canDownloadAll = baseImages.length > 0 && !!wmUrl

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 24, alignItems: 'start' }}>
      {/* Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* 원본 이미지 */}
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>원본 이미지</span>
            {baseImages.length > 0 && (
              <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>{baseImages.length}장</span>
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
            <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleBaseInput} />
          </label>

          {baseImages.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 12, maxHeight: 240, overflowY: 'auto' }}>
              {baseImages.map((img) => (
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

        {/* 워터마크 이미지 */}
        <div className="card" style={{ padding: 16 }}>
          <span style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>워터마크 이미지</span>
          <label
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              border: `2px dashed ${wmDragOver ? '#3b82f6' : 'var(--gray-300)'}`,
              borderRadius: 8,
              height: 88,
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
              transition: 'border-color 0.15s',
            }}
            onDragOver={(e) => { e.preventDefault(); setWmDragOver(true) }}
            onDragLeave={() => setWmDragOver(false)}
            onDrop={(e) => {
              e.preventDefault()
              setWmDragOver(false)
              const file = Array.from(e.dataTransfer.files).find((f) => f.type.startsWith('image/'))
              if (file) setWmUrl(URL.createObjectURL(file))
            }}
          >
            {wmUrl ? (
              <>
                <img src={wmUrl} alt="watermark" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 4 }} />
                <button
                  onClick={(e) => { e.preventDefault(); setWmUrl(null) }}
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    background: 'rgba(0,0,0,0.6)',
                    border: 'none',
                    borderRadius: '50%',
                    width: 22,
                    height: 22,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                  }}
                >
                  <X size={13} />
                </button>
              </>
            ) : (
              <>
                <Upload size={18} color="var(--gray-400)" />
                <span style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 4 }}>클릭 또는 드래그&드롭</span>
              </>
            )}
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleWmInput} />
          </label>
        </div>

        {/* 위치 */}
        <div className="card" style={{ padding: 16 }}>
          <span style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>위치</span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 48px)', gap: 6, margin: '0 auto', width: 'fit-content' }}>
            {POSITIONS.flat().map((p) => (
              <button
                key={p.id}
                onClick={() => setPosition(p.id)}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 18,
                  fontFamily: 'monospace',
                  background: position === p.id ? '#3b82f6' : 'var(--gray-100)',
                  color: position === p.id ? '#fff' : 'var(--gray-500)',
                  transition: 'background 0.15s',
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* 슬라이더 */}
        <div className="card" style={{ padding: 16 }}>
          <span style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>설정</span>
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 14 }}>
              <span style={{ color: 'var(--gray-500)' }}>불투명도</span>
              <span style={{ fontFamily: 'monospace' }}>{opacity}%</span>
            </div>
            <input type="range" min={10} max={100} value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} style={{ width: '100%', accentColor: '#3b82f6' }} />
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 14 }}>
              <span style={{ color: 'var(--gray-500)' }}>워터마크 크기</span>
              <span style={{ fontFamily: 'monospace' }}>{wmScale}%</span>
            </div>
            <input type="range" min={5} max={100} value={wmScale} onChange={(e) => setWmScale(Number(e.target.value))} style={{ width: '100%', accentColor: '#3b82f6' }} />
          </div>
        </div>

        {/* 다운로드 버튼 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            onClick={downloadSelected}
            disabled={!canDownload}
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 0' }}
          >
            <Download size={16} />
            선택 이미지 다운로드
          </button>
          <button
            onClick={downloadAll}
            disabled={!canDownloadAll || downloading}
            className="btn"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 0', background: '#059669', color: '#fff', border: 'none' }}
          >
            <FileArchive size={16} />
            {downloading ? 'ZIP 생성 중...' : `전체 ZIP 다운로드 (${baseImages.length}장)`}
          </button>
        </div>
      </div>

      {/* 미리보기 */}
      <div className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        {!selectedImage ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: 'var(--gray-300)' }}>
            <ImageIcon size={40} />
            <p style={{ fontSize: 14, margin: 0 }}>원본 이미지를 업로드하면 미리보기가 표시됩니다</p>
          </div>
        ) : (
          <canvas ref={canvasRef} style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain', borderRadius: 8 }} />
        )}
      </div>
    </div>
  )
}
