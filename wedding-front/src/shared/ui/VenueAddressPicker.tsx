import { useEffect, useRef, useState } from 'react'
import type { NaverLatLng, NaverMapInstance, NaverMarker } from '@/shared/types/naver-maps'
import styles from './VenueAddressPicker.module.css'

interface VenueAddressPickerProps {
  initialAddress?: string
  initialLat?: number
  initialLng?: number
  onChange: (venue: { address: string; lat: number; lng: number }) => void
}

// 초기 좌표가 없을 때 지도 기본 중심 (서울시청)
const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 }

export default function VenueAddressPicker({ initialAddress, initialLat, initialLng, onChange }: VenueAddressPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<NaverMapInstance | null>(null)
  const markerRef = useRef<NaverMarker | null>(null)
  const [query, setQuery] = useState(initialAddress ?? '')
  const queryRef = useRef(query)
  queryRef.current = query
  const [error, setError] = useState<string | null>(null)
  const [isSearching, setIsSearching] = useState(false)

  const placeMarker = (position: NaverLatLng) => {
    const maps = window.naver.maps
    const map = mapRef.current
    if (!map) return
    if (markerRef.current) {
      markerRef.current.setPosition(position)
    } else {
      const marker = new maps.Marker({ position, map, draggable: true })
      marker.addListener('dragend', () => handleMarkerDragEnd(marker))
      markerRef.current = marker
    }
  }

  const handleMarkerDragEnd = (marker: NaverMarker) => {
    const position = marker.getPosition()
    const maps = window.naver.maps
    maps.Service.reverseGeocode({ coords: position }, (status, response) => {
      const lat = position.lat()
      const lng = position.lng()
      if (status !== maps.Service.Status.OK) {
        onChange({ address: queryRef.current, lat, lng })
        return
      }
      const result = response.v2.results[0]
      const address = result
        ? [result.region.area1.name, result.region.area2.name, result.region.area3.name, result.land?.name].filter(Boolean).join(' ')
        : queryRef.current
      setQuery(address)
      onChange({ address, lat, lng })
    })
  }

  useEffect(() => {
    const init = () => {
      if (!window.naver?.maps || !mapContainerRef.current) return
      const maps = window.naver.maps
      const hasInitial = initialLat != null && initialLng != null
      const center = new maps.LatLng(hasInitial ? initialLat! : DEFAULT_CENTER.lat, hasInitial ? initialLng! : DEFAULT_CENTER.lng)
      const map = new maps.Map(mapContainerRef.current, { center, zoom: 16 })
      mapRef.current = map
      if (hasInitial) placeMarker(center)
    }

    if (window.naver?.maps) {
      init()
    } else {
      const interval = setInterval(() => {
        if (window.naver?.maps) {
          clearInterval(interval)
          init()
        }
      }, 100)
      return () => clearInterval(interval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSearch = () => {
    if (!query.trim()) return
    const maps = window.naver?.maps
    if (!maps) return
    setIsSearching(true)
    setError(null)
    maps.Service.geocode({ query }, (status, response) => {
      setIsSearching(false)
      if (status !== maps.Service.Status.OK || response.v2.addresses.length === 0) {
        setError('주소를 찾을 수 없습니다. 다른 검색어로 시도해보세요.')
        return
      }
      const addr = response.v2.addresses[0]
      const lat = Number(addr.y)
      const lng = Number(addr.x)
      const address = addr.roadAddress || addr.jibunAddress
      const position = new maps.LatLng(lat, lng)
      mapRef.current?.setCenter(position)
      placeMarker(position)
      setQuery(address)
      onChange({ address, lat, lng })
    })
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.searchRow}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSearch() } }}
          placeholder="예식장 주소를 검색하세요"
          className={styles.searchInput}
        />
        <button type="button" onClick={handleSearch} disabled={isSearching} className={styles.searchButton}>
          {isSearching ? '검색 중...' : '검색'}
        </button>
      </div>
      {error && <p className={styles.errorText}>{error}</p>}
      <div ref={mapContainerRef} className={styles.map} />
      <p className={styles.hint}>지도의 마커를 드래그해서 정확한 위치로 조정할 수 있습니다.</p>
    </div>
  )
}
