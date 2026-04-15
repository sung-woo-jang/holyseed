/**
 * 지정된 시간만큼 대기
 * @param ms 대기 시간 (밀리초)
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * 랜덤한 시간만큼 대기 (봇 감지 방지)
 * @param min 최소 대기 시간 (밀리초)
 * @param max 최대 대기 시간 (밀리초)
 */
export const randomDelay = (min: number, max: number): Promise<void> => {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min
  return delay(ms)
}
