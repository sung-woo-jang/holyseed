import { useEffect } from 'react'

export default function NaverMapScript() {
  useEffect(() => {
    const naverClientId = import.meta.env.VITE_NAVER_MAP_CLIENT_ID

    if (!naverClientId) {
      console.warn('Naver Map Client ID is not configured (VITE_NAVER_MAP_CLIENT_ID)')
      return
    }

    if (document.getElementById('naver-map-script')) return

    const script = document.createElement('script')
    script.id = 'naver-map-script'
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${naverClientId}`
    script.async = true
    document.head.appendChild(script)

    return () => {
      document.getElementById('naver-map-script')?.remove()
    }
  }, [])

  return null
}
