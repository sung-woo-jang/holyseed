export interface TossRateLimitInfo {
  limit: string | null;
  remaining: string | null;
  reset: string | null;
  retryAfter: string | null;
}

export interface TossApiErrorInit {
  method: string;
  path: string;
  status: number;
  code?: string;
  requestId?: string;
  tossMessage?: string;
  data?: Record<string, unknown>;
  rawBody?: string;
  retries?: number;
  rateLimit?: TossRateLimitInfo;
}

const CODE_SUMMARY: Record<string, string> = {
  'rate-limit-exceeded': '요청 한도 초과',
  'order-hours-closed': '주문 불가 시간',
  'insufficient-buying-power': '매수가능금액 부족',
  'idempotency-key-conflict': '중복 주문 키 충돌',
  'request-in-progress': '이전 요청 처리 중',
  'already-filled': '이미 체결된 주문',
  'already-canceled': '이미 취소된 주문',
  'order-not-found': '주문을 찾을 수 없음',
  'expired-token': '토큰 만료',
  'invalid-token': '유효하지 않은 토큰',
  'internal-error': '토스 서버 오류',
  maintenance: '토스 점검 중',
};

function shortPath(path: string): string {
  return path.replace(/^\/api\/v1/, '').replace(/\/([A-Za-z0-9_-]{16,})/g, (_, id: string) => `/${id.slice(0, 8)}…`);
}

function formatKst(iso: string): string | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/** 토스 REST 비정상 응답. 메시지는 앱의 한 줄 목록에서 핵심이 앞쪽에 보이도록 "{상태} {요약} · {코드} · {요청} · 요청 ID" 순서로 만든다 */
export class TossApiError extends Error {
  readonly method: string;
  readonly path: string;
  readonly status: number;
  readonly code?: string;
  readonly requestId?: string;
  readonly data?: Record<string, unknown>;
  readonly retries: number;
  readonly rateLimit?: TossRateLimitInfo;

  constructor(init: TossApiErrorInit) {
    super(TossApiError.buildMessage(init));
    this.name = 'TossApiError';
    Object.setPrototypeOf(this, TossApiError.prototype);
    this.method = init.method;
    this.path = init.path;
    this.status = init.status;
    this.code = init.code;
    this.requestId = init.requestId;
    this.data = init.data;
    this.retries = init.retries ?? 0;
    this.rateLimit = init.rateLimit;
  }

  private static buildMessage(init: TossApiErrorInit): string {
    let summary =
      (init.code && CODE_SUMMARY[init.code]) ||
      init.tossMessage ||
      (init.rawBody ? init.rawBody.slice(0, 120) : '오류');
    const retryAfterAt = typeof init.data?.retryAfterAt === 'string' ? formatKst(init.data.retryAfterAt) : null;
    if (retryAfterAt) summary += ` · ${retryAfterAt} 이후 가능`;

    const parts = [`${init.status} ${summary}`];
    if (init.code) parts.push(init.code);
    parts.push(`${init.method} ${shortPath(init.path)}`);
    if (init.retries) parts.push(`재시도 ${init.retries}회 실패`);
    if (init.requestId) parts.push(`요청 ID ${init.requestId}`);
    return parts.join(' · ');
  }
}

/** 토스 에러 본문 `{ error: { requestId, code, message, data } }`을 파싱. 형식이 다르면 undefined 필드로 둔다 */
export function parseTossErrorBody(
  text: string,
): Pick<TossApiErrorInit, 'code' | 'requestId' | 'tossMessage' | 'data'> {
  try {
    const json = JSON.parse(text) as {
      error?: { requestId?: unknown; code?: unknown; message?: unknown; data?: unknown };
    };
    const e = json.error;
    if (!e || typeof e !== 'object') return {};
    return {
      code: typeof e.code === 'string' ? e.code : undefined,
      requestId: typeof e.requestId === 'string' ? e.requestId : undefined,
      tossMessage: typeof e.message === 'string' ? e.message : undefined,
      data: e.data && typeof e.data === 'object' ? (e.data as Record<string, unknown>) : undefined,
    };
  } catch {
    return {};
  }
}
