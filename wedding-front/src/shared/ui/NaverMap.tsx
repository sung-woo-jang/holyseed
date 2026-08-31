import { useEffect, useRef } from 'react'
import cn from 'classnames'
import { useToast } from '@/shared/ui/toast'
import styles from './NaverMap.module.css'

interface NaverMapProps {
  lat: number
  lng: number
  venueName: string
  address: string
  photoUrl?: string
  weddingDateLabel?: string
}

const MARKER_SIZE = 64

const buildMarkerIcon = (photoUrl: string) => ({
  content: `
    <div style="width:${MARKER_SIZE}px;height:${MARKER_SIZE}px;border-radius:50%;overflow:hidden;background:#fff;box-shadow:0 0 0 1px #000000,0 6px 14px rgba(0,0,0,0.35);">
      <img src="${photoUrl}" style="width:100%;height:100%;object-fit:cover;display:block;" />
    </div>
  `,
})

const buildInfoWindowContent = (venueName: string, weddingDateLabel?: string) => `
  <div style="position:relative;padding:12px 18px;background:#ffffff;border-radius:20px;box-shadow:0 8px 20px rgba(0,0,0,0.2);white-space:nowrap;font-family:inherit;">
    <div style="font-size:13px;font-weight:700;color:#222;">💌 ${venueName}</div>
    <div style="margin-top:2px;font-size:11px;font-weight:600;color:#666;">우리 결혼식이 열리는 곳이에요</div>
    ${weddingDateLabel ? `<div style="margin-top:2px;font-size:10px;color:#999;">${weddingDateLabel}에 결혼합니다</div>` : ''}
    <div style="position:absolute;left:50%;bottom:-8px;transform:translateX(-50%);width:0;height:0;border-left:8px solid transparent;border-right:8px solid transparent;border-top:9px solid #ffffff;"></div>
  </div>
`

export default function NaverMap({ lat, lng, venueName, address, photoUrl, weddingDateLabel }: NaverMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const toast = useToast()

  useEffect(() => {
    const loadNaverMap = () => {
      if (!window.naver || !window.naver.maps) {
        console.error('Naver Maps API not loaded')
        return
      }

      if (!mapRef.current) return

      const center = new window.naver.maps.LatLng(lat, lng)
      const map = new window.naver.maps.Map(mapRef.current, {
        center,
        zoom: 16,
        draggable: false,
        scrollWheel: false,
        pinchZoom: false,
        disableDoubleClickZoom: true,
        disableDoubleTapZoom: true,
        disableTwoFingerTapZoom: true,
        zoomControl: false,
        keyboardShortcuts: false,
      })

      const marker = new window.naver.maps.Marker({
        position: center,
        map,
        icon: photoUrl
          ? { ...buildMarkerIcon(photoUrl), size: new window.naver.maps.Size(MARKER_SIZE, MARKER_SIZE), anchor: new window.naver.maps.Point(MARKER_SIZE / 2, MARKER_SIZE / 2) }
          : undefined,
      })

      const infowindow = new window.naver.maps.InfoWindow({
        content: buildInfoWindowContent(venueName, weddingDateLabel),
        borderWidth: 0,
        backgroundColor: 'transparent',
        anchorSize: new window.naver.maps.Size(0, 0),
        pixelOffset: new window.naver.maps.Point(0, -6),
      })
      infowindow.open(map, marker)
    }

    if (window.naver && window.naver.maps) {
      loadNaverMap()
    } else {
      const checkInterval = setInterval(() => {
        if (window.naver && window.naver.maps) {
          clearInterval(checkInterval)
          loadNaverMap()
        }
      }, 100)

      return () => clearInterval(checkInterval)
    }
  }, [lat, lng, venueName, photoUrl, weddingDateLabel])

  const openNaverMap = () => {
    window.open(`https://map.naver.com/p/search/${encodeURIComponent(venueName)}`, '_blank')
  }

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(address)
      toast.success('주소가 복사되었습니다.')
    } catch {
      toast.error('주소 복사에 실패했습니다.')
    }
  }

  return (
    <div className={styles.wrapper}>
      <div ref={mapRef} className={styles.map}></div>
      <div className={styles.addressRow}>
        <span className={styles.addressText}>{address}</span>
      </div>
      <div className={styles.buttons}>
        <button type="button" onClick={handleCopyAddress} className={cn(styles.button, styles.buttonMap)}>
          주소 복사
        </button>
        <button type="button" onClick={openNaverMap} className={cn(styles.button, styles.buttonMap)}>
          <svg className={styles.naverIcon} viewBox="0 0 24 24" aria-hidden="true">
            <rect width="24" height="24" rx="6" fill="#03C75A" />
            <path d="M12 5c-2.76 0-5 2.24-5 5 0 3.75 5 9 5 9s5-5.25 5-9c0-2.76-2.24-5-5-5zm0 7a2 2 0 110-4 2 2 0 010 4z" fill="#ffffff" />
          </svg>
          네이버지도
        </button>
      </div>
    </div>
  )
}
