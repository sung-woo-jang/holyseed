import { Injectable, Logger } from '@nestjs/common';
import { TossApiError, TossClientService } from './toss-client.service';

export const HUB_SYMBOLS = ['TQQQ', 'SOXL', 'SPCX', 'UPRO'] as const;

const FRESH_MS = 5_000;
const STALE_AFTER_MS = 20_000;
const RATE_LIMIT_BACKOFF_MS = 30_000;
const ERROR_BACKOFF_MS = 3_000;

export interface HubPrice {
  symbol: string;
  price: number;
  ts: string;
  /** 허브가 이 값을 토스에서 받아온 시각(ms) */
  fetchedAt: number;
  /** 갱신이 한동안 실패해 오래된 값을 쓰고 있음 */
  stale: boolean;
}

/**
 * 화면용 가격 허브 — 전 종목을 한 번의 `/prices?symbols=…` 호출로 조회해 5초간 재사용한다.
 * - 요청이 있을 때만 토스를 호출한다(보는 사람이 없으면 호출 0). 동시 요청은 하나로 합친다.
 * - 429를 받으면 30초간 호출을 멈추고 마지막 값을 stale로 내보낸다 → 한도가 빠듯할 때 주문 엔진에 양보.
 * - 주문 엔진(laofus·VR)의 가격·주문 조회는 이 서비스를 쓰지 않고 TossClientService를 직접 쓴다.
 */
@Injectable()
export class TossPriceHubService {
  private readonly logger = new Logger(TossPriceHubService.name);
  private readonly prices = new Map<string, { price: number; ts: string }>();
  private fetchedAt = 0;
  private backoffUntil = 0;
  private inflight: Promise<void> | null = null;
  private lastError: unknown = null;

  constructor(private readonly toss: TossClientService) {}

  async getPrice(symbol: string): Promise<HubPrice> {
    await this.refreshIfNeeded();
    const hit = this.prices.get(symbol);
    if (!hit) {
      if (this.lastError) throw this.lastError;
      throw new Error(`${symbol} 시세 없음`);
    }
    return { symbol, ...hit, fetchedAt: this.fetchedAt, stale: Date.now() - this.fetchedAt > STALE_AFTER_MS };
  }

  private async refreshIfNeeded(): Promise<void> {
    const now = Date.now();
    if (now - this.fetchedAt < FRESH_MS) return;
    if (now < this.backoffUntil) return;
    if (!this.inflight) {
      this.inflight = this.refresh().finally(() => {
        this.inflight = null;
      });
    }
    await this.inflight;
  }

  private async refresh(): Promise<void> {
    try {
      const list = await this.toss.getPrices([...HUB_SYMBOLS], { retry: false });
      for (const p of list) this.prices.set(p.symbol, { price: Number(p.lastPrice), ts: p.timestamp });
      this.fetchedAt = Date.now();
      this.lastError = null;
    } catch (e) {
      this.lastError = e;
      const message = e instanceof Error ? e.message : String(e);
      if (e instanceof TossApiError && e.status === 429) {
        this.backoffUntil = Date.now() + RATE_LIMIT_BACKOFF_MS;
        this.logger.warn(`가격 허브: 한도 초과 — ${RATE_LIMIT_BACKOFF_MS / 1000}초간 호출 중단 (${message})`);
      } else {
        this.backoffUntil = Date.now() + ERROR_BACKOFF_MS;
        this.logger.warn(`가격 허브 갱신 실패: ${message}`);
      }
    }
  }
}
