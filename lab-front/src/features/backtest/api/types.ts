export const BACKTEST_SYMBOLS = ['TQQQ', 'QLD', 'SSO', 'UPRO', 'SOXL', 'QQQM', 'SPYM'] as const
export type BacktestSymbol = (typeof BACKTEST_SYMBOLS)[number]

export interface PricePoint {
  date: string
  close: number
}

export interface GetPricesInput {
  symbol: BacktestSymbol
  years: number
  untilDate?: string
}
