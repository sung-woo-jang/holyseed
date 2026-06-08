import { useState, useRef } from 'react'
import QRCode from 'qrcode'
import { Download, QrCode } from 'lucide-react'

const ERROR_LEVELS = [
  { value: 'L', label: 'L — 저 (7%)' },
  { value: 'M', label: 'M — 중 (15%)' },
  { value: 'Q', label: 'Q — 높 (25%)' },
  { value: 'H', label: 'H — 최고 (30%)' },
]

export default function QrCodePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [text, setText] = useState('')
  const [size, setSize] = useState(400)
  const [margin, setMargin] = useState(2)
  const [errorLevel, setErrorLevel] = useState<'L' | 'M' | 'Q' | 'H'>('M')
  const [darkColor, setDarkColor] = useState('#000000')
  const [lightColor, setLightColor] = useState('#ffffff')
  const [generated, setGenerated] = useState(false)

  async function generate() {
    if (!text.trim() || !canvasRef.current) return
    await QRCode.toCanvas(canvasRef.current, text, {
      width: size,
      margin,
      errorCorrectionLevel: errorLevel,
      color: { dark: darkColor, light: lightColor },
    })
    setGenerated(true)
  }

  async function regenerate(overrides: Partial<{ size: number; margin: number; errorLevel: 'L' | 'M' | 'Q' | 'H'; darkColor: string; lightColor: string }>) {
    if (!generated || !text.trim() || !canvasRef.current) return
    await QRCode.toCanvas(canvasRef.current, text, {
      width: overrides.size ?? size,
      margin: overrides.margin ?? margin,
      errorCorrectionLevel: overrides.errorLevel ?? errorLevel,
      color: { dark: overrides.darkColor ?? darkColor, light: overrides.lightColor ?? lightColor },
    })
  }

  function download(format: 'png' | 'svg') {
    if (!text.trim()) return
    if (format === 'png') {
      if (!canvasRef.current) return
      const a = document.createElement('a')
      a.href = canvasRef.current.toDataURL('image/png')
      a.download = 'qrcode.png'
      a.click()
    } else {
      QRCode.toString(text, {
        type: 'svg',
        margin,
        errorCorrectionLevel: errorLevel,
        color: { dark: darkColor, light: lightColor },
      }).then((svg) => {
        const blob = new Blob([svg], { type: 'image/svg+xml' })
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = 'qrcode.svg'
        a.click()
      })
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24, alignItems: 'start' }}>
      {/* Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* 텍스트 입력 */}
        <div className="card" style={{ padding: 16 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
            내용 (URL / 텍스트)
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="https://example.com"
            rows={4}
            style={{
              width: '100%',
              resize: 'vertical',
              border: '1px solid var(--gray-300)',
              borderRadius: 6,
              padding: '8px 10px',
              fontSize: 14,
              fontFamily: 'monospace',
              boxSizing: 'border-box',
              outline: 'none',
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) generate()
            }}
          />
          <button
            onClick={generate}
            disabled={!text.trim()}
            className="btn-primary"
            style={{ width: '100%', marginTop: 10, padding: '9px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            <QrCode size={15} />
            생성 (⌘Enter)
          </button>
        </div>

        {/* 설정 */}
        <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>설정</span>

          {/* 크기 */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 14 }}>
              <span style={{ color: 'var(--gray-500)' }}>크기</span>
              <span style={{ fontFamily: 'monospace' }}>{size}px</span>
            </div>
            <input
              type="range" min={128} max={1024} step={16} value={size}
              onChange={(e) => {
                const v = Number(e.target.value)
                setSize(v)
                regenerate({ size: v })
              }}
              style={{ width: '100%', accentColor: '#3b82f6' }}
            />
          </div>

          {/* 여백 */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 14 }}>
              <span style={{ color: 'var(--gray-500)' }}>여백</span>
              <span style={{ fontFamily: 'monospace' }}>{margin}</span>
            </div>
            <input
              type="range" min={0} max={10} value={margin}
              onChange={(e) => {
                const v = Number(e.target.value)
                setMargin(v)
                regenerate({ margin: v })
              }}
              style={{ width: '100%', accentColor: '#3b82f6' }}
            />
          </div>

          {/* 오류 정정 */}
          <div>
            <div style={{ fontSize: 14, color: 'var(--gray-500)', marginBottom: 6 }}>오류 정정 수준</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
              {ERROR_LEVELS.map(({ value }) => (
                <button
                  key={value}
                  onClick={() => {
                    const v = value as typeof errorLevel
                    setErrorLevel(v)
                    regenerate({ errorLevel: v })
                  }}
                  style={{
                    padding: '6px 0',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 600,
                    background: errorLevel === value ? '#3b82f6' : 'var(--gray-100)',
                    color: errorLevel === value ? '#fff' : 'var(--gray-500)',
                    transition: 'background 0.15s',
                  }}
                >
                  {value}
                </button>
              ))}
            </div>
            <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 4 }}>
              {ERROR_LEVELS.find((e) => e.value === errorLevel)?.label}
            </div>
          </div>

          {/* 색상 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ fontSize: 14, color: 'var(--gray-500)', marginBottom: 4 }}>QR 색상</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="color" value={darkColor}
                  onChange={(e) => {
                    setDarkColor(e.target.value)
                    regenerate({ darkColor: e.target.value })
                  }}
                  style={{ width: 36, height: 36, border: 'none', cursor: 'pointer', borderRadius: 4 }}
                />
                <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--gray-400)' }}>{darkColor}</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 14, color: 'var(--gray-500)', marginBottom: 4 }}>배경 색상</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="color" value={lightColor}
                  onChange={(e) => {
                    setLightColor(e.target.value)
                    regenerate({ lightColor: e.target.value })
                  }}
                  style={{ width: 36, height: 36, border: 'none', cursor: 'pointer', borderRadius: 4, outline: '1px solid var(--gray-300)' }}
                />
                <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--gray-400)' }}>{lightColor}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 다운로드 */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => download('png')}
            disabled={!generated}
            className="btn-primary"
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 0' }}
          >
            <Download size={15} />
            PNG
          </button>
          <button
            onClick={() => download('svg')}
            disabled={!generated}
            className="btn"
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 0', background: '#059669', color: '#fff', border: 'none' }}
          >
            <Download size={15} />
            SVG
          </button>
        </div>
      </div>

      {/* 미리보기 */}
      <div className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <canvas
          ref={canvasRef}
          style={{ maxWidth: '100%', borderRadius: 8, display: generated ? 'block' : 'none' }}
        />
        {!generated && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: 'var(--gray-300)' }}>
            <QrCode size={48} />
            <p style={{ fontSize: 14, margin: 0 }}>내용을 입력하고 생성 버튼을 누르세요</p>
          </div>
        )}
      </div>
    </div>
  )
}
