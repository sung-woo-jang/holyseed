import { useEffect, useRef, useState } from 'react'

type Phase = 'enter' | 'open' | 'drag' | 'close'

interface Props {
  onClose: () => void
  maxHeight?: string
  children: (requestClose: () => void) => React.ReactNode
}

export function BottomSheet({ onClose, children, maxHeight = '90vh' }: Props) {
  const [phase, setPhase] = useState<Phase>('enter')
  const [dragY, setDragY] = useState(0)
  const startY = useRef(0)
  const pendingClose = useRef(false)
  const DISMISS = 120

  // 마운트 후 한 프레임 뒤에 open으로 전환 → 슬라이드 업 애니메이션
  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setPhase('open')))
    return () => cancelAnimationFrame(id)
  }, [])

  // 시트 열림 동안 body 스크롤 잠금
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  function requestClose() {
    if (pendingClose.current) return
    pendingClose.current = true
    setPhase('close')
    setDragY(0)
    setTimeout(onClose, 300)
  }

  function onTouchStart(e: React.TouchEvent) {
    startY.current = e.touches[0].clientY
    setPhase('drag')
  }

  function onTouchMove(e: React.TouchEvent) {
    const delta = e.touches[0].clientY - startY.current
    setDragY(Math.max(0, delta))
  }

  function onTouchEnd() {
    if (dragY >= DISMISS) {
      requestClose()
    } else {
      setDragY(0)
      setPhase('open')
    }
  }

  const isDragging = phase === 'drag'
  const isHidden = phase === 'enter' || phase === 'close'

  const sheetY = isHidden
    ? 'translateX(-50%) translateY(100%)'
    : isDragging
      ? `translateX(-50%) translateY(${dragY}px)`
      : 'translateX(-50%) translateY(0)'

  const backdropAlpha = isHidden ? 0 : isDragging ? Math.max(0, 0.5 * (1 - dragY / 300)) : 0.5

  return (
    <>
      {/* 백드롭 — touchmove 차단해서 배경 스크롤 방지 */}
      <div
        onClick={requestClose}
        onTouchMove={(e) => e.preventDefault()}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 100,
          background: `rgba(0,0,0,${backdropAlpha})`,
          transition: isDragging ? 'none' : 'background 0.3s',
          touchAction: 'none',
        }}
      />

      {/* 시트 */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: '50%',
          width: '100%',
          maxWidth: 480,
          background: 'var(--color-card)',
          borderRadius: '20px 20px 0 0',
          zIndex: 101,
          maxHeight,
          display: 'flex',
          flexDirection: 'column',
          transform: sheetY,
          transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
          willChange: 'transform',
        }}
      >
        {/* 드래그 핸들 — 이 영역만 드래그 dismiss 트리거 */}
        <div
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          style={{
            padding: '14px 0 6px',
            flexShrink: 0,
            touchAction: 'none',
            cursor: 'grab',
          }}
        >
          <div
            style={{
              width: 36,
              height: 4,
              background: 'var(--color-border)',
              borderRadius: 2,
              margin: '0 auto',
              transition: isDragging ? 'none' : 'background 0.2s',
            }}
          />
        </div>

        {/* 스크롤 가능한 콘텐츠 영역 — overscroll 격리로 배경 전파 차단 */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            minHeight: 0,
            paddingBottom: 'env(safe-area-inset-bottom)',
            overscrollBehavior: 'contain',
          }}
        >
          {children(requestClose)}
        </div>
      </div>
    </>
  )
}
