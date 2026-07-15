/**
 * laofus 1차 사이클 시딩 (노션 "매매 히스토리" 2026-06-16~07-13 마이그레이션 데이터).
 * 기존 laofus/webapp의 seed-notion.ts와 동일 데이터 — 기존 SOXL 데이터 전부 삭제 후 재시딩.
 *
 * 실행: yarn laofus:seed  (backend 디렉터리)
 */
import { NestFactory } from '@nestjs/core'
import { DataSource } from 'typeorm'
import { AppModule } from '../../../app.module'
import { LaofusCycle } from '../entities/cycle.entity'
import { LaofusEngineState } from '../entities/engine-state.entity'
import { LaofusEvent } from '../entities/event.entity'
import { LaofusTrade } from '../entities/trade.entity'

interface SeedTrade {
  date: string
  kind: string
  side: 'BUY' | 'SELL'
  price: number
  quantity: number
  amount: number
  tAfter: number
  avgAfter: number
  qtyAfter: number
  cashAfter: number
  note?: string
}

const APPROX = '스냅샷 근사 (노션 미기재, 6/23 확정값 역산)'

const trades: SeedTrade[] = [
  {
    date: '2026-06-16',
    kind: '이월',
    side: 'BUY',
    price: 265.4,
    quantity: 0.037688,
    amount: 0,
    tAfter: 0,
    avgAfter: 265.4,
    qtyAfter: 0.037688,
    cashAfter: 2000.0,
    note: '사이클 시작 전 이월잔고 (금액은 사이클 원금 외)',
  },
  {
    date: '2026-06-16',
    kind: '사이클시작',
    side: 'BUY',
    price: 272.45,
    quantity: 0.091758,
    amount: 24.999467,
    tAfter: 0.5,
    avgAfter: 270.39,
    qtyAfter: 0.129446,
    cashAfter: 1965.01,
    note: APPROX,
  },
  {
    date: '2026-06-17',
    kind: '전액',
    side: 'BUY',
    price: 243.851987,
    quantity: 0.122942,
    amount: 29.979651,
    tAfter: 1.5,
    avgAfter: 257.47,
    qtyAfter: 0.252388,
    cashAfter: 1935.03,
    note: APPROX + ' — 별지점+평단 2건',
  },
  {
    date: '2026-06-18',
    kind: '절반',
    side: 'BUY',
    price: 272.6,
    quantity: 0.055025,
    amount: 14.999815,
    tAfter: 2.0,
    avgAfter: 260.17,
    qtyAfter: 0.307413,
    cashAfter: 1920.03,
    note: APPROX + ' — 1건 취소',
  },
  {
    date: '2026-06-22',
    kind: '절반',
    side: 'BUY',
    price: 300.68,
    quantity: 0.083144,
    amount: 24.999738,
    tAfter: 2.0994,
    avgAfter: 268.79,
    qtyAfter: 0.390557,
    cashAfter: 1895.03,
    note: APPROX + ' — 1건 취소, T는 노션 6/23 확정값 역산',
  },
  {
    date: '2026-06-23',
    kind: '전액',
    side: 'BUY',
    price: 247.809869,
    quantity: 0.201766,
    amount: 49.999606,
    tAfter: 3.0994,
    avgAfter: 261.64,
    qtyAfter: 0.592323,
    cashAfter: 1845.03,
  },
  {
    date: '2026-06-24',
    kind: '전액',
    side: 'BUY',
    price: 227.242624,
    quantity: 0.220028,
    amount: 49.99974,
    tAfter: 4.0994,
    avgAfter: 252.32,
    qtyAfter: 0.812351,
    cashAfter: 1795.03,
  },
  {
    date: '2026-06-25',
    kind: '절반',
    side: 'BUY',
    price: 235.822067,
    quantity: 0.106012,
    amount: 24.999969,
    tAfter: 4.5994,
    avgAfter: 250.42,
    qtyAfter: 0.918363,
    cashAfter: 1770.04,
    note: '1건 취소',
  },
  {
    date: '2026-06-26',
    kind: '전액',
    side: 'BUY',
    price: 228.330003,
    quantity: 0.21898,
    amount: 49.999704,
    tAfter: 5.5994,
    avgAfter: 246.16,
    qtyAfter: 1.137343,
    cashAfter: 1720.06,
  },
  {
    date: '2026-06-29',
    kind: '전액',
    side: 'BUY',
    price: 201.960359,
    quantity: 0.247572,
    amount: 49.99973,
    tAfter: 6.5994,
    avgAfter: 238.26,
    qtyAfter: 1.384915,
    cashAfter: 1670.07,
  },
  {
    date: '2026-06-30',
    kind: '절반',
    side: 'BUY',
    price: 258.959872,
    quantity: 0.09654,
    amount: 24.999986,
    tAfter: 7.0994,
    avgAfter: 239.61,
    qtyAfter: 1.481455,
    cashAfter: 1645.07,
    note: '1건 취소',
  },
  {
    date: '2026-07-01',
    kind: '전액',
    side: 'BUY',
    price: 232.79,
    quantity: 0.214657,
    amount: 49.969885,
    tAfter: 8,
    avgAfter: 238.75,
    qtyAfter: 1.696112,
    cashAfter: 1595.06,
    note: '2건 합산 (7/1 23:15 + 7/2 02:25 체결)',
  },
  {
    date: '2026-07-02',
    kind: '전액',
    side: 'BUY',
    price: 221.69,
    quantity: 0.22554,
    amount: 49.999962,
    tAfter: 9,
    avgAfter: 236.74,
    qtyAfter: 1.921652,
    cashAfter: 1545.11,
  },
  {
    date: '2026-07-06',
    kind: '전액',
    side: 'BUY',
    price: 208.2999,
    quantity: 0.240038,
    amount: 49.999892,
    tAfter: 10,
    avgAfter: 233.58,
    qtyAfter: 2.16169,
    cashAfter: 1495.06,
  },
  {
    date: '2026-07-07',
    kind: '전액',
    side: 'BUY',
    price: 160.3,
    quantity: 0.311914,
    amount: 49.999814,
    tAfter: 11,
    avgAfter: 224.34,
    qtyAfter: 2.473604,
    cashAfter: 1445.06,
  },
  {
    date: '2026-07-08',
    kind: '전액',
    side: 'BUY',
    price: 171.269888,
    quantity: 0.291936,
    amount: 49.999846,
    tAfter: 12,
    avgAfter: 218.75,
    qtyAfter: 2.76554,
    cashAfter: 1395.06,
  },
  {
    date: '2026-07-09',
    kind: '전액',
    side: 'BUY',
    price: 203.240035,
    quantity: 0.246014,
    amount: 49.999894,
    tAfter: 13,
    avgAfter: 217.47,
    qtyAfter: 3.011554,
    cashAfter: 1345.06,
  },
  {
    date: '2026-07-10',
    kind: '전액',
    side: 'BUY',
    price: 186.980135,
    quantity: 0.267408,
    amount: 49.999984,
    tAfter: 14,
    avgAfter: 214.99,
    qtyAfter: 3.278962,
    cashAfter: 1295.06,
  },
  {
    date: '2026-07-13',
    kind: '전액',
    side: 'BUY',
    price: 171.47,
    quantity: 0.291596,
    amount: 49.999966,
    tAfter: 15,
    avgAfter: 211.44,
    qtyAfter: 3.570558,
    cashAfter: 1245.06,
  },
]

const SYMBOL = 'SOXL'

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] })
  const ds = app.get(DataSource)

  await ds.getRepository(LaofusTrade).createQueryBuilder().delete().execute()
  await ds.getRepository(LaofusCycle).createQueryBuilder().delete().execute()
  await ds.getRepository(LaofusEngineState).createQueryBuilder().delete().execute()

  const cycle = await ds.getRepository(LaofusCycle).save({
    symbol: SYMBOL,
    cycleNo: 1,
    startDate: '2026-06-16',
    principal: '2000',
  })

  let tBefore = 0
  let seq = 0
  for (const t of trades) {
    seq += 1
    await ds.getRepository(LaofusTrade).save({
      cycleId: cycle.id,
      seq,
      date: t.date,
      kind: t.kind,
      side: t.side,
      price: String(t.price),
      quantity: String(t.quantity),
      amount: String(t.amount),
      tBefore: String(tBefore),
      tAfter: String(t.tAfter),
      avgAfter: String(t.avgAfter),
      qtyAfter: String(t.qtyAfter),
      cashAfter: String(t.cashAfter),
      note: t.note ?? '노션 마이그레이션',
    })
    tBefore = t.tAfter
  }

  const last = trades[trades.length - 1]
  await ds.getRepository(LaofusEngineState).save({
    symbol: SYMBOL,
    t: String(last.tAfter),
    quantity: String(last.qtyAfter),
    avgPrice: String(last.avgAfter),
    cash: String(last.cashAfter),
    principal: '2000',
    cycleNo: 1,
    cycleDone: false,
  })

  await ds.getRepository(LaofusEvent).save({
    level: 'info',
    source: 'engine',
    message: `laofus 시딩 완료: trade ${seq}건, 최종 T=${last.tAfter}, 잔금=$${last.cashAfter}`,
  })

  console.log(`시딩 완료: cycle 1, trades ${seq}건`)
  console.log(`engine_state: T=${last.tAfter}, qty=${last.qtyAfter}, avg=$${last.avgAfter}, cash=$${last.cashAfter}`)
  await app.close()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
