export interface NaverLatLng {
  lat(): number
  lng(): number
}

export interface NaverMapInstance {
  setCenter(position: NaverLatLng): void
}

export interface NaverMarker {
  setPosition(position: NaverLatLng): void
  getPosition(): NaverLatLng
  addListener(event: string, handler: (...args: unknown[]) => void): void
}

export interface NaverMarkerIcon {
  content?: string
  url?: string
  size?: unknown
  anchor?: unknown
}

export interface NaverGeocodeAddress {
  roadAddress: string
  jibunAddress: string
  x: string
  y: string
}

export interface NaverGeocodeResponse {
  v2: {
    addresses: NaverGeocodeAddress[]
  }
}

export interface NaverReverseGeocodeResult {
  region: { area1: { name: string }; area2: { name: string }; area3: { name: string }; area4: { name: string } }
  land?: { name?: string; number1?: string; number2?: string }
}

export interface NaverReverseGeocodeResponse {
  v2: {
    results: NaverReverseGeocodeResult[]
  }
}

interface NaverMapsService {
  geocode(
    options: { query: string },
    callback: (status: string, response: NaverGeocodeResponse) => void,
  ): void
  reverseGeocode(
    options: { coords: NaverLatLng; orders?: string },
    callback: (status: string, response: NaverReverseGeocodeResponse) => void,
  ): void
  Status: { OK: string; ERROR: string }
}

interface NaverMaps {
  LatLng: new (lat: number, lng: number) => NaverLatLng
  Point: new (x: number, y: number) => unknown
  Size: new (width: number, height: number) => unknown
  Map: new (
    container: HTMLElement,
    options: {
      center: NaverLatLng
      zoom: number
      draggable?: boolean
      scrollWheel?: boolean
      pinchZoom?: boolean
      disableDoubleClickZoom?: boolean
      disableDoubleTapZoom?: boolean
      disableTwoFingerTapZoom?: boolean
      zoomControl?: boolean
      keyboardShortcuts?: boolean
    },
  ) => NaverMapInstance
  Marker: new (options: { position: NaverLatLng; map: unknown; draggable?: boolean; icon?: NaverMarkerIcon }) => NaverMarker
  InfoWindow: new (options: {
    content: string
    borderWidth?: number
    backgroundColor?: string
    anchorSize?: unknown
    pixelOffset?: unknown
  }) => { open: (map: unknown, marker: unknown) => void }
  Service: NaverMapsService
}

declare global {
  interface Window {
    naver: {
      maps: NaverMaps
    }
  }
}
