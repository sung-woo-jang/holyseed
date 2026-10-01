import { useEffect, useState } from 'react'

const MIN = 60_000

/** 다음 자정까지 남을수록 느리게, 가까울수록 촘촘하게 갱신하고, 마지막 틱은 자정 직후에 맞춘다 */
function nextDelay(now: Date): number {
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime()
  const msLeft = midnight - now.getTime()
  const step = msLeft > 10 * MIN ? 10_000 : msLeft > MIN ? 3_000 : 1_000
  return Math.min(step, msLeft + 50)
}

export function useNow(): Date {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    let timer: number
    const tick = () => {
      const d = new Date()
      setNow(d)
      window.clearTimeout(timer)
      timer = window.setTimeout(tick, nextDelay(d))
    }
    const onVisible = () => document.visibilityState === 'visible' && tick()

    timer = window.setTimeout(tick, nextDelay(new Date()))
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', tick)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', tick)
    }
  }, [])

  return now
}
