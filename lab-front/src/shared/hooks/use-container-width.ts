import { useCallback, useEffect, useState } from 'react'

/**
 * ResizeObserver로 컨테이너 실측 폭을 추적하는 훅
 * SVG 차트/캔버스를 컨테이너 폭에 맞게 동적으로 스케일링할 때 사용
 *
 * 콜백 ref를 사용 — 로딩 상태 등으로 컨테이너 엘리먼트가 초기 렌더 이후
 * 뒤늦게 마운트되는 경우에도 그 시점에 ResizeObserver를 붙일 수 있어야 하기 때문
 * (일반 useRef + 빈 deps effect는 첫 렌더에 엘리먼트가 없으면 이후 마운트를 놓침)
 */
export function useContainerWidth<T extends HTMLElement>(fallback: number) {
  const [node, setNode] = useState<T | null>(null)
  const [width, setWidth] = useState(fallback)
  const ref = useCallback((el: T | null) => setNode(el), [])

  useEffect(() => {
    if (!node) return

    const ro = new ResizeObserver(([entry]) => {
      setWidth(entry.contentRect.width)
    })
    ro.observe(node)
    return () => ro.disconnect()
  }, [node])

  return { ref, width }
}
