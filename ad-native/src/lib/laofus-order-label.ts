/**
 * 엔진이 SOXL에 거는 매도 주문은 두 종류다 — 별지점 LOC(쿼터매도, 보유 1/4)와 평단 +20% 지정가(전량매도).
 * 라이브 주문 응답엔 종류 필드가 없어 주문 유형(LOC/지정가)으로 구분한다. SOXL 외(VR의 TQQQ 사다리 등)는 그냥 매도.
 */
export function sellKindOfOrder(symbol: string, order: { side: string; type: string }): '쿼터매도' | '전량매도' | null {
  if (symbol !== 'SOXL' || order.side !== 'SELL') return null;
  return order.type === 'LOC' ? '쿼터매도' : '전량매도';
}

export function orderSideLabel(symbol: string, order: { side: string; type: string }): string {
  if (order.side === 'BUY') return '매수';
  return sellKindOfOrder(symbol, order) ?? '매도';
}
