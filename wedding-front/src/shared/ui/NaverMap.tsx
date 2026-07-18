import { useEffect, useRef } from 'react'
import cn from 'classnames'
import styles from './NaverMap.module.css'

interface NaverMapProps {
  lat: number
  lng: number
  venueName: string
  address: string
}

interface NaverMaps {
  LatLng: new (lat: number, lng: number) => unknown
  Map: new (container: HTMLElement, options: { center: unknown; zoom: number }) => unknown
  Marker: new (options: { position: unknown; map: unknown }) => unknown
  InfoWindow: new (options: { content: string }) => { open: (map: unknown, marker: unknown) => void }
}

declare global {
  interface Window {
    naver: {
      maps: NaverMaps
    }
  }
}

export default function NaverMap({ lat, lng, venueName }: NaverMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)

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
      })

      const marker = new window.naver.maps.Marker({
        position: center,
        map,
      })

      const iwContent = `<div style="padding:5px;font-size:12px;">${venueName}</div>`
      const infowindow = new window.naver.maps.InfoWindow({
        content: iwContent,
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
  }, [lat, lng, venueName])

  const openNaverNavi = () => {
    window.open(`https://map.naver.com/p/directions/-/${lng},${lat},${encodeURIComponent(venueName)}/-/car`, '_blank')
  }

  const openNaverMap = () => {
    window.open(`https://map.naver.com/p/search/${encodeURIComponent(venueName)}`, '_blank')
  }

  return (
    <div className={styles.wrapper}>
      <div ref={mapRef} className={styles.map}></div>
      <div className={styles.buttons}>
        <button type="button" onClick={openNaverNavi} className={cn(styles.button, styles.buttonNaver)}>
          <span role="img" aria-label="navi">
            🚗
          </span>{' '}
          네이버내비
        </button>
        <button type="button" onClick={openNaverMap} className={cn(styles.button, styles.buttonMap)}>
          <span role="img" aria-label="map">
            🗺️
          </span>{' '}
          네이버지도
        </button>
      </div>
    </div>
  )
}
