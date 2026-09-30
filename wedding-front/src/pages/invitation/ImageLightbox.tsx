import { useRef, useState } from 'react'
import type { TouchEvent as ReactTouchEvent } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Keyboard, Zoom } from 'swiper/modules'
import type { Swiper as SwiperType } from 'swiper'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/zoom'

import RetryImg from '@/shared/ui/RetryImg'
import styles from './InvitationPage.module.css'

// 라이트박스 아래로 드래그해서 닫기 임계값
const DISMISS_AXIS_LOCK_PX = 10
const DISMISS_DISTANCE_RATIO = 0.18
const DISMISS_MIN_DISTANCE_PX = 100
const DISMISS_VELOCITY_PX_MS = 0.5
const DISMISS_FADE_RATIO = 0.75
const DISMISS_MIN_OPACITY = 0.15

// 현재 슬라이드 기준 이 범위 밖 슬라이드는 <img>를 마운트하지 않음 —
// 전 슬라이드를 한꺼번에 디코딩하면 iOS 사파리가 메모리 초과로 탭을 죽이고 페이지를 재로드함
const MOUNT_RADIUS = 2

interface LightboxImage {
  src: string
  alt?: string
}

interface ImageLightboxProps {
  images: LightboxImage[]
  initialIndex: number
  onClose: () => void
}

export default function ImageLightbox({ images, initialIndex, onClose }: ImageLightboxProps) {
  // 슬라이드 번호를 이 컴포넌트 안에서만 들고 있어야 넘길 때마다 메인 페이지 전체가 리렌더되지 않음
  const [currentSlideIndex, setCurrentSlideIndex] = useState(initialIndex)
  const swiperRef = useRef<SwiperType | null>(null)
  const lightboxOverlayRef = useRef<HTMLDivElement | null>(null)
  const zoomScaleRef = useRef(1)
  const dismissDragRef = useRef({
    active: false,
    axisLocked: null as null | 'x' | 'y',
    startX: 0,
    startY: 0,
    startTime: 0,
    lastY: 0,
    lastTime: 0,
  })

  const handleZoomChange = (_swiper: SwiperType, scale: number) => { zoomScaleRef.current = scale }

  // 아래로 드래그하면 라이트박스가 닫히는 제스처. 핀치줌 중이거나(zoomScaleRef>1)
  // 가로 스와이프(이미지 전환)로 판정되면 관여하지 않고 Swiper 자체 동작에 맡김.
  const handleTouchStart = (e: ReactTouchEvent<HTMLDivElement>) => {
    if (e.touches.length !== 1) return
    const drag = dismissDragRef.current
    drag.active = true
    drag.axisLocked = null
    drag.startX = e.touches[0].clientX
    drag.startY = e.touches[0].clientY
    drag.startTime = Date.now()
    drag.lastY = drag.startY
    drag.lastTime = drag.startTime
  }

  const handleTouchMove = (e: ReactTouchEvent<HTMLDivElement>) => {
    const drag = dismissDragRef.current
    if (!drag.active || e.touches.length !== 1) return

    if (zoomScaleRef.current > 1.01) {
      drag.active = false
      return
    }

    const touch = e.touches[0]
    const dx = touch.clientX - drag.startX
    const dy = touch.clientY - drag.startY

    if (drag.axisLocked === null) {
      if (Math.abs(dx) < DISMISS_AXIS_LOCK_PX && Math.abs(dy) < DISMISS_AXIS_LOCK_PX) return
      drag.axisLocked = Math.abs(dy) > Math.abs(dx) ? 'y' : 'x'
      if (drag.axisLocked === 'y') {
        if (swiperRef.current) swiperRef.current.allowTouchMove = false
        if (lightboxOverlayRef.current) lightboxOverlayRef.current.style.transition = 'none'
      }
    }

    if (drag.axisLocked !== 'y') return

    drag.lastY = touch.clientY
    drag.lastTime = Date.now()

    const node = lightboxOverlayRef.current
    if (!node) return

    if (dy <= 0) {
      node.style.transform = 'translateY(0px)'
      node.style.opacity = '1'
      return
    }

    node.style.transform = `translateY(${dy}px)`
    const progress = Math.min(dy / (window.innerHeight * DISMISS_FADE_RATIO), 1)
    node.style.opacity = String(Math.max(1 - progress, DISMISS_MIN_OPACITY))
  }

  const handleTouchEnd = () => {
    const drag = dismissDragRef.current
    if (!drag.active) return
    drag.active = false

    const wasVertical = drag.axisLocked === 'y'
    drag.axisLocked = null

    if (swiperRef.current) swiperRef.current.allowTouchMove = true

    if (!wasVertical) return

    const dy = drag.lastY - drag.startY
    const dt = Math.max(drag.lastTime - drag.startTime, 1)
    const velocity = dy / dt

    const node = lightboxOverlayRef.current
    if (!node) return

    const threshold = Math.max(DISMISS_MIN_DISTANCE_PX, window.innerHeight * DISMISS_DISTANCE_RATIO)

    if (dy > 0 && (dy > threshold || velocity > DISMISS_VELOCITY_PX_MS)) {
      node.style.transition = 'transform 200ms ease-in, opacity 200ms ease-in'
      node.style.transform = `translateY(${window.innerHeight}px)`
      node.style.opacity = '0'
      window.setTimeout(onClose, 200)
    } else if (dy > 0) {
      node.style.transition = 'transform 200ms cubic-bezier(0.4, 0, 0.2, 1), opacity 200ms cubic-bezier(0.4, 0, 0.2, 1)'
      node.style.transform = 'translateY(0px)'
      node.style.opacity = '1'
    } else {
      node.style.transition = ''
    }
  }

  return (
    <div
      ref={lightboxOverlayRef}
      className={styles.lightbox}
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      <button className={styles.lightboxClose} onClick={onClose} aria-label="Close">✕</button>
      <div className={styles.swiperContainer} onClick={(e) => e.stopPropagation()}>
        <Swiper
          modules={[Navigation, Keyboard, Zoom]}
          navigation={{ prevEl: `.${styles.swiperPrev}`, nextEl: `.${styles.swiperNext}` }}
          keyboard={{ enabled: true }}
          zoom={{ maxRatio: 3 }}
          initialSlide={initialIndex}
          spaceBetween={50}
          slidesPerView={1}
          speed={400}
          rewind
          onSwiper={(s) => { swiperRef.current = s }}
          onSlideChange={(s) => { setCurrentSlideIndex(s.realIndex); zoomScaleRef.current = 1 }}
          onZoomChange={handleZoomChange}
          className={styles.swiper}
        >
          {images.map((image, index) => (
            <SwiperSlide key={index} className={styles.swiperSlide}>
              <div className="swiper-zoom-container">
                {Math.abs(index - currentSlideIndex) <= MOUNT_RADIUS && (
                  <RetryImg src={image.src} alt={image.alt || `Image ${index + 1}`} className={styles.lightboxImage} />
                )}
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
        <button className={styles.swiperPrev} aria-label="Previous">‹</button>
        <button className={styles.swiperNext} aria-label="Next">›</button>
        <div className={styles.lightboxCounter}>{currentSlideIndex + 1} / {images.length}</div>
      </div>
    </div>
  )
}
