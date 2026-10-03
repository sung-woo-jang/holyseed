import { Injectable } from '@nestjs/common';
import { TossClientService } from '@shared/toss/toss-client.service';
import { TossPriceHubService } from '@shared/toss/toss-price-hub.service';

export interface EvaluationPrice {
  price: number;
  /** 종가 기준일(CLOSE) — 현재가(LIVE)면 null */
  date: string | null;
  source: 'CLOSE' | 'LIVE';
}

const CANDLE_TTL_MS = 5 * 60_000;

/** 실력공식의 마지막 평가금(E)에 쓸 TQQQ 가격 — 사이클이 끝난 뒤 갱신하면 종료일 종가, 아직이면 현재가 */
@Injectable()
export class VrEvaluationService {
  private candleCache: { closes: Map<string, number>; at: number } | null = null;

  constructor(
    private readonly toss: TossClientService,
    private readonly hub: TossPriceHubService,
  ) {}

  async resolvePrice(cycleEndDate: string, todayKst = kstToday()): Promise<EvaluationPrice> {
    // 종료일 당일·다음 날(KST)은 미국 장이 막 끝났거나 진행 중이라 일봉이 확정 전일 수 있어 현재가로 본다
    if (daysBetween(cycleEndDate, todayKst) >= 2) {
      const close = await this.closeOnOrBefore(cycleEndDate);
      if (close) return { price: close.price, date: close.date, source: 'CLOSE' };
    }
    const live = await this.hub.getPrice('TQQQ');
    return { price: live.price, date: null, source: 'LIVE' };
  }

  private async closeOnOrBefore(date: string): Promise<{ price: number; date: string } | null> {
    if (!this.candleCache || Date.now() - this.candleCache.at > CANDLE_TTL_MS) {
      const res = await this.toss.getCandles('TQQQ', '1d', 60);
      this.candleCache = {
        closes: new Map(res.candles.map((c) => [c.timestamp.slice(0, 10), Number(c.closePrice)])),
        at: Date.now(),
      };
    }
    const days = [...this.candleCache.closes.keys()].filter((d) => d <= date).sort();
    const last = days[days.length - 1];
    if (!last) return null;
    return { price: this.candleCache.closes.get(last) as number, date: last };
  }
}

function kstToday(): string {
  return new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10);
}

function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}
