import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { Injectable, Logger } from '@nestjs/common';

const BASE_URL = 'https://openapi.tossinvest.com';
// client당 유효 토큰 1개(재발급 시 기존 무효화) + AUTH rate limit 때문에 프로세스 재시작 간 토큰 공유 필수
const TOKEN_CACHE_PATH = join(process.cwd(), '.laofus-token-cache.json');

export interface TossPrice {
  symbol: string;
  timestamp: string;
  lastPrice: string;
  currency: string;
}

export interface TossHoldingItem {
  symbol: string;
  name: string;
  quantity: string;
  averagePurchasePrice: string;
  lastPrice: string;
  marketValue: { amount: string; purchaseAmount: string };
  profitLoss: { amount: string; rate: string };
  dailyProfitLoss: { amount: string; rate: string };
}

export interface TossOrder {
  orderId: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  orderType: string;
  status: string;
  quantity: string;
  orderAmount: string | null;
  orderedAt: string;
  execution: {
    filledQuantity: string;
    averageFilledPrice: string | null;
    filledAmount: string | null;
    commission: string | null;
    filledAt: string | null;
  };
}

export interface TossCandle {
  timestamp: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  closePrice: string;
  volume: string;
}

@Injectable()
export class TossClientService {
  private readonly logger = new Logger(TossClientService.name);
  private token: string | null = null;
  private tokenExpiresAt = 0;
  private accountSeq: number | null = null;

  private get clientId(): string {
    const v = process.env.TOSS_CLIENT_ID;
    if (!v) throw new Error('TOSS_CLIENT_ID 미설정');
    return v;
  }

  private get clientSecret(): string {
    const v = process.env.TOSS_CLIENT_SECRET;
    if (!v) throw new Error('TOSS_CLIENT_SECRET 미설정');
    return v;
  }

  private loadCache(): boolean {
    try {
      if (!existsSync(TOKEN_CACHE_PATH)) return false;
      const c = JSON.parse(readFileSync(TOKEN_CACHE_PATH, 'utf8')) as {
        token: string;
        expiresAt: number;
        accountSeq?: number;
      };
      if (typeof c.accountSeq === 'number') this.accountSeq = c.accountSeq;
      if (c.token && Date.now() < c.expiresAt) {
        this.token = c.token;
        this.tokenExpiresAt = c.expiresAt;
        return true;
      }
    } catch {
      /* 캐시 없음 */
    }
    return false;
  }

  private saveCache(): void {
    try {
      mkdirSync(dirname(TOKEN_CACHE_PATH), { recursive: true });
      writeFileSync(
        TOKEN_CACHE_PATH,
        JSON.stringify({ token: this.token, expiresAt: this.tokenExpiresAt, accountSeq: this.accountSeq }),
        { mode: 0o600 },
      );
    } catch (e) {
      this.logger.warn(`토큰 캐시 저장 실패: ${e}`);
    }
  }

  private async fetchToken(): Promise<void> {
    const res = await fetch(`${BASE_URL}/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret,
      }),
    });
    if (!res.ok) throw new Error(`토스 토큰 발급 실패 ${res.status}: ${await res.text()}`);
    const data = (await res.json()) as { access_token: string; expires_in?: number };
    this.token = data.access_token;
    this.tokenExpiresAt = Date.now() + ((data.expires_in ?? 86400) - 60) * 1000;
    this.saveCache();
  }

  private async getToken(): Promise<string> {
    if (!this.token || Date.now() >= this.tokenExpiresAt) {
      if (!this.loadCache()) await this.fetchToken();
    }
    return this.token as string;
  }

  private async request<T>(
    method: 'GET' | 'POST',
    path: string,
    opts: { params?: Record<string, string>; body?: unknown; withAccount?: boolean } = {},
  ): Promise<T> {
    const headers: Record<string, string> = { Authorization: `Bearer ${await this.getToken()}` };
    if (opts.withAccount) headers['X-Tossinvest-Account'] = String(await this.getAccountSeq());
    let url = `${BASE_URL}${path}`;
    if (opts.params) url += `?${new URLSearchParams(opts.params)}`;
    const init: RequestInit = { method, headers };
    if (opts.body !== undefined) {
      headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(opts.body);
    }
    let res = await fetch(url, init);
    if (res.status === 401) {
      await this.fetchToken();
      headers.Authorization = `Bearer ${this.token}`;
      res = await fetch(url, init);
    }
    if (!res.ok) throw new Error(`${method} ${path} 실패 ${res.status}: ${await res.text()}`);
    const json = (await res.json()) as { result: T };
    return json.result;
  }

  async getAccountSeq(): Promise<number> {
    if (this.accountSeq === null) {
      const accounts = await this.request<Array<{ accountSeq: number }>>('GET', '/api/v1/accounts');
      if (!accounts.length) throw new Error('연동된 계좌 없음');
      this.accountSeq = accounts[0].accountSeq;
      this.saveCache();
    }
    return this.accountSeq;
  }

  async getPrice(symbol: string): Promise<TossPrice> {
    const prices = await this.request<TossPrice[]>('GET', '/api/v1/prices', { params: { symbols: symbol } });
    if (!prices.length) throw new Error(`${symbol} 시세 없음`);
    return prices[0];
  }

  async getCandles(
    symbol: string,
    interval: '1m' | '1d',
    count = 200,
  ): Promise<{ candles: TossCandle[]; nextBefore: string | null }> {
    return this.request('GET', '/api/v1/candles', { params: { symbol, interval, count: String(count) } });
  }

  async getExchangeRate(): Promise<{ rate: string; midRate: string; rateChangeType: string }> {
    return this.request('GET', '/api/v1/exchange-rate', {
      params: { baseCurrency: 'USD', quoteCurrency: 'KRW' },
    });
  }

  async getUsMarketCalendar(): Promise<unknown> {
    return this.request('GET', '/api/v1/market-calendar/US');
  }

  async getHoldingsAll(): Promise<{ items: TossHoldingItem[] }> {
    return this.request('GET', '/api/v1/holdings', { withAccount: true });
  }

  async getHolding(symbol: string): Promise<TossHoldingItem | null> {
    const result = await this.request<{ items: TossHoldingItem[] }>('GET', '/api/v1/holdings', {
      params: { symbol },
      withAccount: true,
    });
    return result.items.find((i) => i.symbol === symbol) ?? null;
  }

  async getBuyingPower(currency: 'KRW' | 'USD'): Promise<string> {
    const result = await this.request<{ cashBuyingPower: string }>('GET', '/api/v1/buying-power', {
      params: { currency },
      withAccount: true,
    });
    return result.cashBuyingPower;
  }

  async getOrders(
    status: 'OPEN' | 'CLOSED',
    opts: { symbol?: string; limit?: number } = {},
  ): Promise<{ orders: TossOrder[]; nextCursor: string | null; hasNext: boolean }> {
    const params: Record<string, string> = { status };
    if (opts.symbol) params.symbol = opts.symbol;
    if (opts.limit) params.limit = String(opts.limit);
    return this.request('GET', '/api/v1/orders', { params, withAccount: true });
  }

  async getOrder(orderId: string): Promise<TossOrder> {
    return this.request('GET', `/api/v1/orders/${orderId}`, { withAccount: true });
  }

  /** 금액 기반 시장가 매수 (US 전용, 정규장만, 소수점 체결) */
  async buyByAmount(symbol: string, amountUsd: string, clientOrderId: string): Promise<TossOrder> {
    return this.request('POST', '/api/v1/orders', {
      body: { symbol, side: 'BUY', orderType: 'MARKET', orderAmount: amountUsd, clientOrderId },
      withAccount: true,
    });
  }

  /** 소수점 수량 시장가 매도 (US 전용, 정규장만, 6자리) */
  async sellByQuantity(symbol: string, quantity: string, clientOrderId: string): Promise<TossOrder> {
    return this.request('POST', '/api/v1/orders', {
      body: { symbol, side: 'SELL', orderType: 'MARKET', quantity, clientOrderId },
      withAccount: true,
    });
  }
}
