import { useEffect, useRef, useState } from 'react'
import type { ImgHTMLAttributes } from 'react'

const MAX_RETRIES = 3
const RETRY_DELAY_MS = 800

// 일시적인 네트워크 끊김/요청 취소로 <img>가 깨진 상태(엑박)로 굳는 것을 방지 —
// 지연 후 캐시 우회 쿼리를 붙여 재요청함 (브라우저는 실패한 <img>를 스스로 재시도하지 않음)
export default function RetryImg({ src, ...rest }: ImgHTMLAttributes<HTMLImageElement>) {
  const [attempt, setAttempt] = useState(0)
  const timerRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    setAttempt(0)
  }, [src])

  useEffect(() => () => window.clearTimeout(timerRef.current), [])

  const handleError = () => {
    if (attempt >= MAX_RETRIES) return
    timerRef.current = window.setTimeout(() => setAttempt((a) => a + 1), RETRY_DELAY_MS * (attempt + 1))
  }

  const finalSrc = attempt > 0 && src ? `${src}${src.includes('?') ? '&' : '?'}_r=${attempt}` : src

  return <img {...rest} src={finalSrc} onError={handleError} />
}
