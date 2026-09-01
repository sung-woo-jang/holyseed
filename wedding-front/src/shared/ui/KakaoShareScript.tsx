import { useEffect } from 'react'

declare global {
  interface Window {
    Kakao?: {
      isInitialized: () => boolean
      init: (key: string) => void
      Share: {
        sendDefault: (settings: Record<string, any>) => void
      }
    }
  }
}

export default function KakaoShareScript() {
  useEffect(() => {
    const kakaoJsKey = import.meta.env.VITE_KAKAO_JS_KEY

    if (!kakaoJsKey) {
      console.warn('Kakao JS Key is not configured (VITE_KAKAO_JS_KEY)')
      return
    }

    if (document.getElementById('kakao-share-script')) {
      if (window.Kakao && !window.Kakao.isInitialized()) window.Kakao.init(kakaoJsKey)
      return
    }

    const script = document.createElement('script')
    script.id = 'kakao-share-script'
    script.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2.8.1/kakao.min.js'
    script.async = true
    script.onload = () => {
      if (window.Kakao && !window.Kakao.isInitialized()) window.Kakao.init(kakaoJsKey)
    }
    document.head.appendChild(script)
  }, [])

  return null
}
