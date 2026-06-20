import { lazy, Suspense, useEffect, useRef, useState } from 'react'
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

import { CoupleProvider, useCouple } from '@/shared/lib/couple-context'
import { api } from '@/shared/api'
import { Media, WeddingVenue, AccountInfo, mediaResizedUrl } from '@/shared/types'
import NetflixIntro from '@/widgets/netflix-intro/NetflixIntro'
import NetflixNav from '@/shared/ui/NetflixNav'
import NetflixRow from '@/widgets/netflix-row/NetflixRow'
import VenueModal from '@/shared/ui/VenueModal'
import AttendanceModal from '@/features/rsvp/AttendanceModal'
import KakaoMapScript from '@/shared/ui/KakaoMapScript'
import styles from './InvitationPage.module.css'

const KakaoMap = lazy(() => import('@/shared/ui/KakaoMap'))

const GALLERY_IMAGES = [
  '/wedding/스크린샷 2026-03-24 오전 9.09.21.png',
  '/wedding/스크린샷 2026-03-24 오전 9.09.30.png',
  '/wedding/스크린샷 2026-03-24 오전 9.09.38.png',
  '/wedding/스크린샷 2026-03-24 오전 9.09.50.png',
  '/wedding/스크린샷 2026-03-24 오전 9.10.25.png',
]

function InvitationContent() {
  const { couple, isLoading, error } = useCouple()
  const [showIntro, setShowIntro] = useState(true)
  const [wasSkipped, setWasSkipped] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [currentRowId, setCurrentRowId] = useState<string | null>(null)
  const [videoLightbox, setVideoLightbox] = useState<string | null>(null)
  const [guestMedia, setGuestMedia] = useState<Media[]>([])
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [venueModalOpen, setVenueModalOpen] = useState(false)
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false)
  const [dynamicContentRows, setDynamicContentRows] = useState<any[]>([])
  const swiperRef = useRef<SwiperType | null>(null)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxIndex(null)
        setVideoLightbox(null)
        setVenueModalOpen(false)
        setAttendanceModalOpen(false)
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [])

  useEffect(() => {
    if (lightboxIndex !== null || videoLightbox !== null || venueModalOpen || attendanceModalOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [lightboxIndex, videoLightbox, venueModalOpen, attendanceModalOpen])

  useEffect(() => {
    if (!couple?.id) return
    api.post('/media/search', { coupleId: couple.id, moderationStatus: 'APPROVED', limit: 10 })
      .then((res) => setGuestMedia(res.data.data?.media ?? []))
      .catch(() => {})
  }, [couple?.id])

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
      .catch(() => {})
  }, [couple?.id])

  if (isLoading) return <div style={{ color: '#fff', padding: '2rem' }}>로딩 중...</div>
  if (error || !couple) return <Navigate to="/login" replace />

  const venue = couple.weddingVenue as WeddingVenue | null
  const accountInfo = couple.accountInfo as AccountInfo[]
  const weddingDate = couple.weddingDate ? new Date(couple.weddingDate) : null

  const openLightbox = (index: number) => { setLightboxIndex(index); setCurrentSlideIndex(index) }
  const closeLightbox = () => { setLightboxIndex(null); setCurrentSlideIndex(0); swiperRef.current = null }

  const systemRows = [
    {
      id: 'wedding-info',
      title: '웨딩데이 정보',
      type: 'info-card-row',
      items: [
        venue ? { type: 'info-card', icon: '📍', title: venue.name, subtitle: venue.hall || '', content: venue.address, action: { label: '자세히 보기', onClick: () => setVenueModalOpen(true) } } : null,
        weddingDate ? { type: 'calendar-card', year: format(weddingDate, 'yyyy'), month: format(weddingDate, 'MMMM', { locale: ko }).toUpperCase(), day: format(weddingDate, 'd'), dayName: format(weddingDate, 'EEEE', { locale: ko }), time: format(weddingDate, 'a h:mm', { locale: ko }) } : null,
        { type: 'info-card', icon: '✉️', title: '참석 여부', subtitle: '알려주세요', content: '소중한 시간 함께 해주시는 모든 분들께 감사드립니다', action: { label: '참석 응답하기', onClick: () => setAttendanceModalOpen(true) } },
      ].filter(Boolean),
    },
    ...(accountInfo?.length > 0 ? [{
      id: 'account-info',
      title: '축의금 안내',
      type: 'account-card-row',
      items: accountInfo.map((account) => ({
        type: 'account-card', icon: '🎁', relation: account.relation, holder: account.holder, bank: account.bank, account: account.account,
        action: { label: '계좌번호 복사', onClick: () => { navigator.clipboard.writeText(account.account); alert('계좌번호가 복사되었습니다.') } },
      })),
    }] : []),
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
      <KakaoMapScript />
      <NetflixNav coupleSlug={couple.slug} groomName={couple.groomName} brideName={couple.brideName} />

      <div className={cn(styles.container, { [styles.zoomInFromIntro]: !showIntro && !wasSkipped, [styles.fadeInNormal]: !showIntro && wasSkipped })}>
        {/* Hero */}
        <section className={styles.hero}>
          <div className={styles.heroImage}>
            <img src="/wedding/스크린샷 2026-03-24 오전 9.09.21.png" alt={`${couple.groomName} & ${couple.brideName}`} className={styles.heroPhoto} />
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
                  <svg className={styles.infoIcon} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" fill="none" strokeWidth="2" /><text x="12" y="16" textAnchor="middle" fill="currentColor" fontSize="14" fontWeight="bold">i</text></svg><span>상세 정보</span>
                </button>
              </div>
            </div>
          </div>
          <div className={styles.scrollIndicator}><span>SCROLL</span><div className={styles.scrollLine} /></div>
        </section>

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
        {venue?.lat && venue?.lng && (
          <section className={cn(styles.section, styles.mapSection)}>
            <h2 className={styles.sectionTitle}>오시는 길</h2>
            <div className={styles.mapContainer}>
              <Suspense fallback={<p>지도 로딩 중...</p>}>
                <KakaoMap lat={venue.lat} lng={venue.lng} venueName={venue.name} address={venue.address} />
              </Suspense>
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className={styles.footer}>
          <div className={styles.footerDivider} />
          <div className={styles.footerNames}>{couple.groomName} & {couple.brideName}</div>
          {weddingDate && <div className={styles.footerDate}>{format(weddingDate, 'yyyy. MM. dd', { locale: ko })}</div>}
          <div className={styles.footerCopyright}>Wedding Archive</div>
        </footer>

        {/* Lightbox */}
        {lightboxIndex !== null && currentImages.length > 0 && (
          <div className={styles.lightbox} onClick={closeLightbox}>
            <button className={styles.lightboxClose} onClick={closeLightbox} aria-label="Close">✕</button>
            <div className={styles.swiperContainer} onClick={(e) => e.stopPropagation()}>
              <Swiper modules={[Navigation, Keyboard, Zoom]} navigation={{ prevEl: `.${styles.swiperPrev}`, nextEl: `.${styles.swiperNext}` }} keyboard={{ enabled: true }} zoom={{ maxRatio: 3 }} initialSlide={lightboxIndex} spaceBetween={50} slidesPerView={1} speed={400} loop={currentImages.length > 1} onSwiper={(s) => { swiperRef.current = s; setCurrentSlideIndex(s.realIndex) }} onSlideChange={(s) => setCurrentSlideIndex(s.realIndex)} className={styles.swiper}>
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
        {venue?.lat && venue?.lng && (
          <VenueModal isOpen={venueModalOpen} onClose={() => setVenueModalOpen(false)} venueName={venue.name} venueHall={venue.hall} address={venue.address} lat={venue.lat} lng={venue.lng} />
        )}
        <AttendanceModal isOpen={attendanceModalOpen} onClose={() => setAttendanceModalOpen(false)} coupleId={couple.id} groomName={couple.groomName} brideName={couple.brideName} />
      </div>
    </>
  )
}

export default function InvitationPage() {
  const { coupleSlug } = useParams<{ coupleSlug: string }>()
  if (!coupleSlug) return <Navigate to="/login" replace />
  return (
    <CoupleProvider slug={coupleSlug}>
      <InvitationContent />
    </CoupleProvider>
  )
}
