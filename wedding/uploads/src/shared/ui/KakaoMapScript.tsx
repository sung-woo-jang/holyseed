import { useEffect } from 'react'

export default function KakaoMapScript() {
  useEffect(() => {
    const kakaoAppKey = import.meta.env.VITE_KAKAO_APP_KEY

    if (!kakaoAppKey) {
      console.warn('Kakao App Key is not configured (VITE_KAKAO_APP_KEY)')
      return
    }

    if (document.getElementById('kakao-map-script')) return

    const script = document.createElement('script')
    script.id = 'kakao-map-script'
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoAppKey}&autoload=false`
    script.async = true
    document.head.appendChild(script)

    return () => {
      document.getElementById('kakao-map-script')?.remove()
    }
  }, [])

  return null
}
