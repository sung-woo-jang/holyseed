import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import type { TouchEvent as ReactTouchEvent } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import cn from 'classnames'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Keyboard, Zoom } from 'swiper/modules'
import type { Swiper as SwiperType } from 'swiper'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/zoom'

import { CoupleProvider, useCouple, DEFAULT_COUPLE_SLUG } from '@/shared/lib/couple-context'
import { api } from '@/shared/api'
import { Media, WeddingVenue, AccountInfo, mediaResizedUrl } from '@/shared/types'
import NetflixIntro from '@/widgets/netflix-intro/NetflixIntro'
import NetflixNav from '@/shared/ui/NetflixNav'
import NetflixRow from '@/widgets/netflix-row/NetflixRow'
import WeddingCalendar from '@/widgets/wedding-calendar/WeddingCalendar'
import { GuestbookSection } from '@/widgets/guestbook/GuestbookSection'
import AttendanceModal from '@/features/rsvp/AttendanceModal'
import NaverMapScript from '@/shared/ui/NaverMapScript'
import { useToast } from '@/shared/ui/toast'
import styles from './InvitationPage.module.css'

const NaverMap = lazy(() => import('@/shared/ui/NaverMap'))

// 라이트박스 아래로 드래그해서 닫기 임계값
const DISMISS_AXIS_LOCK_PX = 10
const DISMISS_DISTANCE_RATIO = 0.18
const DISMISS_MIN_DISTANCE_PX = 100
const DISMISS_VELOCITY_PX_MS = 0.5
const DISMISS_FADE_RATIO = 0.75
const DISMISS_MIN_OPACITY = 0.15

function InvitationContent() {
  const { couple, isLoading, error } = useCouple()
  const toast = useToast()
  const [showIntro, setShowIntro] = useState(true)
  const [wasSkipped, setWasSkipped] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [currentRowId, setCurrentRowId] = useState<string | null>(null)
  const [videoLightbox, setVideoLightbox] = useState<string | null>(null)
  const [guestMedia, setGuestMedia] = useState<Media[]>([])
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false)
  const [dynamicContentRows, setDynamicContentRows] = useState<any[]>([])
  const [heroIndex, setHeroIndex] = useState(0)
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

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxIndex(null)
        setVideoLightbox(null)
        setAttendanceModalOpen(false)
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [])

  useEffect(() => {
    if (lightboxIndex !== null || videoLightbox !== null || attendanceModalOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [lightboxIndex, videoLightbox, attendanceModalOpen])

  useEffect(() => {
    if (!couple?.id) return
    api.post('/media/search', { coupleId: couple.id, moderationStatus: 'APPROVED', limit: 10 })
      .then((res) => setGuestMedia(res.data.data?.media ?? []))
      // 하객에게는 에러를 노출하지 않고 기본 사진으로 대체 렌더
      .catch((e) => console.warn('하객 미디어 조회 실패', e))
  }, [couple?.id])

  // Hero 배경 자동 전환 (5초 간격 크로스페이드) — 동시 로딩 부담을 줄이기 위해 앞쪽 6장만 순환
  const heroPoolSize = Math.min(guestMedia.length, 6)
  useEffect(() => {
    if (heroPoolSize <= 1) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = setInterval(() => {
      setHeroIndex((i) => (i + 1) % heroPoolSize)
    }, 5000)
    return () => clearInterval(timer)
  }, [heroPoolSize])

  useEffect(() => {
    if (!couple?.id) return
    api.post('/content-rows/search', { coupleId: couple.id, includeHidden: false })
      .then((res) => {
        const rows = res.data.data ?? []
        setDynamicContentRows(rows.map((row: any) => ({
          id: row.id,
          title: row.title,
          type: row.rowType === 'TOP_RANKED' ? 'top-ranked-row' : row.rowType === 'VIDEO_GALLERY' ? 'video-row' : 'image-row',
          items: row.items,
        })))
      })
      // 실패해도 기본 섹션(systemRows)은 렌더되므로 하객에게 에러 미노출
      .catch((e) => console.warn('콘텐츠 Row 조회 실패', e))
  }, [couple?.id])

  if (isLoading) return <div style={{ color: '#fff', padding: '2rem' }}>로딩 중...</div>
  if (error || !couple) return <Navigate to={`/${DEFAULT_COUPLE_SLUG}`} replace />

  const venue = couple.weddingVenue as WeddingVenue | null
  // accountInfo가 배열이 아닐 수도(빈 객체 {}) 있으니 정규화
  const rawAccount = couple.accountInfo as unknown
  const accountInfo: AccountInfo[] = Array.isArray(rawAccount) ? (rawAccount as AccountInfo[]) : []
  const weddingDate = couple.weddingDate ? new Date(couple.weddingDate) : null

  // TOP 5: 승인된 하객 사진만 사용 (5장 미만이면 있는 만큼만 표시)
  const topSources = guestMedia.map((m) => mediaResizedUrl(m.id)).slice(0, 5)
  const topItems = topSources.map((src, i) => ({ type: 'top-ranked', src, rank: i + 1, alt: `Top ${i + 1}` }))

  const openLightbox = (index: number) => { setLightboxIndex(index); setCurrentSlideIndex(index) }
  const closeLightbox = () => { setLightboxIndex(null); setCurrentSlideIndex(0); swiperRef.current = null }

  const handleZoomChange = (_swiper: SwiperType, scale: number) => { zoomScaleRef.current = scale }

  // 아래로 드래그하면 라이트박스가 닫히는 제스처. 핀치줌 중이거나(zoomScaleRef>1)
  // 가로 스와이프(이미지 전환)로 판정되면 관여하지 않고 Swiper 자체 동작에 맡김.
  const handleLightboxTouchStart = (e: ReactTouchEvent<HTMLDivElement>) => {
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

  const handleLightboxTouchMove = (e: ReactTouchEvent<HTMLDivElement>) => {
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

  const handleLightboxTouchEnd = () => {
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
      window.setTimeout(closeLightbox, 200)
    } else if (dy > 0) {
      node.style.transition = 'transform 200ms cubic-bezier(0.4, 0, 0.2, 1), opacity 200ms cubic-bezier(0.4, 0, 0.2, 1)'
      node.style.transform = 'translateY(0px)'
      node.style.opacity = '1'
    } else {
      node.style.transition = ''
    }
  }

  // 관리자가 콘텐츠 Row에서 직접 TOP5 랭킹을 만들었으면 하드코딩된 기본 TOP5는 숨김(중복 방지)
  const hasCustomTopRanked = dynamicContentRows.some((row) => row.type === 'top-ranked-row')

  const systemRows = [
    ...(hasCustomTopRanked ? [] : [{
      id: 'top-ranked',
      title: '오늘의 TOP 5 추억',
      type: 'top-ranked-row',
      items: topItems,
    }]),
    {
      id: 'wedding-info',
      title: '웨딩데이 정보',
      type: 'info-card-row',
      items: [
        ...(accountInfo?.map((account) => ({
          type: 'account-card', icon: '🎁', relation: account.relation, holder: account.holder, bank: account.bank, account: account.account,
          action: { label: '계좌번호 복사', onClick: () => { navigator.clipboard.writeText(account.account).then(() => toast.success('계좌번호가 복사되었습니다.')).catch(() => toast.error('계좌번호 복사에 실패했습니다.')) } },
        })) ?? []),
        { type: 'info-card', icon: '✉️', title: '참석 여부', subtitle: '알려주세요', content: '소중한 시간 함께 해주시는 모든 분들께 감사드립니다', action: { label: '참석 응답하기', onClick: () => setAttendanceModalOpen(true) } },
      ].filter(Boolean),
    },
    {
      id: 'upload-cta',
      title: '함께 만드는 우리의 앨범',
      type: 'mixed-row',
      items: [
        { type: 'upload-card', icon: '📸', title: '사진 업로드', subtitle: '결혼식의 추억을 공유해주세요', action: { label: '사진 업로드하기', href: `/${couple.slug}/gallery` } },
        ...guestMedia.map((m, i) => ({ src: mediaResizedUrl(m.id), alt: `Guest Photo ${i + 1}`, type: 'image' })),
      ],
    },
  ]

  const contentRows = [...dynamicContentRows, ...systemRows]

  const getCurrentRowImages = () => {
    if (!currentRowId) return []
    const row = contentRows.find((r) => r.id === currentRowId)
    if (!row) return []
    return row.items.filter((item: any) => item.type === 'image' || item.type === 'top-ranked')
  }
  const currentImages = getCurrentRowImages()

  return (
    <>
      {showIntro && <NetflixIntro onComplete={(skipped) => { setWasSkipped(skipped); setShowIntro(false) }} />}
      <NaverMapScript />

      <div className={cn(styles.container, { [styles.zoomInFromIntro]: !showIntro && !wasSkipped, [styles.fadeInNormal]: !showIntro && wasSkipped })}>
        <NetflixNav coupleSlug={couple.slug} groomName={couple.groomName} brideName={couple.brideName} />
        {/* Hero */}
        <section className={styles.hero}>
          <div className={styles.heroImage}>
            {guestMedia.slice(0, 6).map((m, i) => {
              const src = mediaResizedUrl(m.id)
              return (
                <div key={m.id} className={cn(styles.heroPhotoWrap, { [styles.heroPhotoActive]: i === heroIndex })}>
                  {/* 세로 사진 등 비율이 다른 사진도 잘리지 않게: 흐린 배경(cover)이 프레임을 채우고, 선명한 원본(contain)은 잘림 없이 통째로 보임 */}
                  <img src={src} alt="" aria-hidden="true" className={styles.heroPhotoBackdrop} loading={i === 0 ? 'eager' : 'lazy'} />
                  <img src={src} alt={`${couple.groomName} & ${couple.brideName}`} className={styles.heroPhotoMain} loading={i === 0 ? 'eager' : 'lazy'} />
                </div>
              )
            })}
            <div className={styles.heroOverlay} />
          </div>
          <div className={styles.heroContent}>
            <div className={styles.heroText}>
              <h1 className={styles.heroNames}>{couple.groomName}<span className={styles.ampersand}>&</span>{couple.brideName}</h1>
              {weddingDate && <time className={styles.heroDate} dateTime={weddingDate.toISOString()}>{format(weddingDate, 'yyyy. MM. dd', { locale: ko })}</time>}
              <div className={styles.heroButtons}>
                <button className={styles.playButton} onClick={() => { const v = document.querySelector('video[data-wedding-video]'); if (v) { v.scrollIntoView({ behavior: 'smooth', block: 'center' }); (v as HTMLVideoElement).play() } }}>
                  <svg className={styles.playIcon} viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill="currentColor" /></svg><span>재생</span>
                </button>
                <button className={styles.moreInfoButton} onClick={() => document.getElementById('wedding-info')?.scrollIntoView({ behavior: 'smooth' })}>
                  <svg className={styles.infoIcon} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" fill="none" strokeWidth="2" /><text x="12" y="12" textAnchor="middle" dominantBaseline="central" fill="currentColor" fontSize="14" fontWeight="bold">i</text></svg><span>상세 정보</span>
                </button>
              </div>
            </div>
          </div>
          <div className={styles.scrollIndicator}><span>SCROLL</span><div className={styles.scrollLine} /></div>
        </section>

        {/* Calendar */}
        {weddingDate && (
          <section id="calendar-section" className={cn(styles.section, styles.calendarSection)}>
            <h2 className={styles.sectionTitle}>결혼식 날짜</h2>
            <WeddingCalendar weddingDate={weddingDate} groomName={couple.groomName} brideName={couple.brideName} />
          </section>
        )}

        {/* Content Rows */}
        <div className={styles.contentRows}>
          {contentRows.map((row) => (
            <NetflixRow
              key={row.id}
              rowId={row.id}
              title={row.title}
              items={row.items}
              onItemClick={['image-row', 'mixed-row', 'top-ranked-row'].includes(row.type) ? (index) => { setCurrentRowId(row.id); openLightbox(index) } : undefined}
              onVideoClick={(src) => setVideoLightbox(src)}
            />
          ))}
        </div>

        {/* Map */}
        {venue && (
          <section id="map-section" className={cn(styles.section, styles.mapSection)}>
            <h2 className={styles.sectionTitle}>오시는 길</h2>
            <div className={styles.mapContainer}>
              {venue.lat && venue.lng ? (
                <Suspense fallback={<p>지도 로딩 중...</p>}>
                  <NaverMap
                    lat={venue.lat}
                    lng={venue.lng}
                    venueName={venue.name}
                    address={venue.address}
                    photoUrl={guestMedia[0] ? mediaResizedUrl(guestMedia[0].id) : undefined}
                    weddingDateLabel={weddingDate ? format(weddingDate, 'yyyy. MM. dd', { locale: ko }) : undefined}
                  />
                </Suspense>
              ) : (
                <div className={styles.mapFallback}>
                  <div className={styles.mapFallbackIcon}>🗺️</div>
                  <div className={styles.mapFallbackName}>{venue.name}{venue.hall ? ` · ${venue.hall}` : ''}</div>
                  <div className={styles.mapFallbackAddr}>{venue.address}</div>
                </div>
              )}
            </div>

            {venue.transportation && (
              <div className={styles.transportInfo}>
                {([
                  { key: 'subway', title: '지하철 이용 시' },
                  { key: 'bus', title: '버스 이용 시' },
                  { key: 'car', title: '자가용 이용 시' },
                  { key: 'parking', title: '주차 안내' },
                ] as const).map(({ key, title }) => {
                  const groups = venue.transportation?.[key]
                  if (!groups || groups.length === 0) return null
                  return (
                    <div key={key} className={styles.transportSection}>
                      <h3 className={styles.transportSectionTitle}>{title}</h3>
                      {groups.map((group, gi) => (
                        <div key={gi} className={styles.transportGroup}>
                          {group.heading && <p className={styles.transportHeading}>{group.heading}</p>}
                          <ul className={styles.transportBullets}>
                            {group.bullets.map((bullet, bi) => (
                              <li key={bi} className={styles.transportBulletItem}>{bullet}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        )}

        {/* Guestbook */}
        <section id="guestbook-section" className={cn(styles.section, styles.guestbookSection)}>
          <h2 className={styles.sectionTitle}>방명록</h2>
          <GuestbookSection coupleId={couple.id} />
        </section>

        {/* Footer */}
        <footer className={styles.footer}>
          <div className={styles.footerDivider} />
          <div className={styles.footerNames}>{couple.groomName} & {couple.brideName}</div>
          {weddingDate && <div className={styles.footerDate}>{format(weddingDate, 'yyyy. MM. dd', { locale: ko })}</div>}
          <div className={styles.footerCopyright}>Wedding Archive</div>
        </footer>

        {/* Lightbox */}
        {lightboxIndex !== null && currentImages.length > 0 && (
          <div
            ref={lightboxOverlayRef}
            className={styles.lightbox}
            onClick={closeLightbox}
            onTouchStart={handleLightboxTouchStart}
            onTouchMove={handleLightboxTouchMove}
            onTouchEnd={handleLightboxTouchEnd}
            onTouchCancel={handleLightboxTouchEnd}
          >
            <button className={styles.lightboxClose} onClick={closeLightbox} aria-label="Close">✕</button>
            <div className={styles.swiperContainer} onClick={(e) => e.stopPropagation()}>
              <Swiper modules={[Navigation, Keyboard, Zoom]} navigation={{ prevEl: `.${styles.swiperPrev}`, nextEl: `.${styles.swiperNext}` }} keyboard={{ enabled: true }} zoom={{ maxRatio: 3 }} initialSlide={lightboxIndex} spaceBetween={50} slidesPerView={1} speed={400} loop={currentImages.length > 1} onSwiper={(s) => { swiperRef.current = s; setCurrentSlideIndex(s.realIndex) }} onSlideChange={(s) => { setCurrentSlideIndex(s.realIndex); zoomScaleRef.current = 1 }} onZoomChange={handleZoomChange} className={styles.swiper}>
                {currentImages.map((image: any, index: number) => (
                  <SwiperSlide key={index} className={styles.swiperSlide}>
                    <div className="swiper-zoom-container">
                      <img src={image.src} alt={image.alt || `Image ${index + 1}`} className={styles.lightboxImage} />
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
              <button className={styles.swiperPrev} aria-label="Previous">‹</button>
              <button className={styles.swiperNext} aria-label="Next">›</button>
              <div className={styles.lightboxCounter}>{currentSlideIndex + 1} / {currentImages.length}</div>
            </div>
          </div>
        )}

        {/* Video Lightbox */}
        {videoLightbox && (
          <div className={styles.videoLightbox} onClick={() => setVideoLightbox(null)}>
            <button className={styles.lightboxClose} onClick={() => setVideoLightbox(null)} aria-label="Close">✕</button>
            <div className={styles.videoLightboxContent} onClick={(e) => e.stopPropagation()}>
              <video className={styles.videoLightboxPlayer} src={videoLightbox} controls autoPlay playsInline />
            </div>
          </div>
        )}

        {/* Modals */}
        <AttendanceModal isOpen={attendanceModalOpen} onClose={() => setAttendanceModalOpen(false)} coupleId={couple.id} groomName={couple.groomName} brideName={couple.brideName} />
      </div>
    </>
  )
}

export default function InvitationPage() {
  const { coupleSlug } = useParams<{ coupleSlug: string }>()
  if (!coupleSlug) return <Navigate to={`/${DEFAULT_COUPLE_SLUG}`} replace />
  return (
    <CoupleProvider slug={coupleSlug}>
      <InvitationContent />
    </CoupleProvider>
  )
}
