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
  Map: new (container: HTMLElement, options: { center: NaverLatLng; zoom: number }) => NaverMapInstance
  Marker: new (options: { position: NaverLatLng; map: unknown; draggable?: boolean }) => NaverMarker
  InfoWindow: new (options: { content: string }) => { open: (map: unknown, marker: unknown) => void }
  Service: NaverMapsService
}

declare global {
  interface Window {
    naver: {
      maps: NaverMaps
    }
  }
}
