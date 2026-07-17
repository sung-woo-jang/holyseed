/**
 * AAPL 프로브 잔여물 전량 매도 — 1회성 (2026-07-17 밤).
 * 소수점 수량 시장가 매도는 정규장만 가능 → 개장(22:30 KST) 5분 뒤 실행.
 * 실행: pm2 one-shot (autorestart 금지). 완료 후 pm2 delete 할 것.
 */
import { readFileSync, writeFileSync } from 'node:fs'

const BASE = 'https://openapi.tossinvest.com'
const SELL_AT = '22:35' // KST

for (const line of readFileSync('.env', 'utf8').split('\n')) {
  const t = line.trim()
  if (!t || t.startsWith('#') || !t.includes('=')) continue
  const i = t.indexOf('=')
  if (!process.env[t.slice(0, i)]) process.env[t.slice(0, i)] = t.slice(i + 1).trim()
}
const log = (m) => console.log(`[${new Date().toISOString()}] ${m}`)
const cache = () => JSON.parse(readFileSync('.laofus-token-cache.json', 'utf8'))

async function freshToken() {
  const res = await fetch(`${BASE}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.TOSS_CLIENT_ID,
      client_secret: process.env.TOSS_CLIENT_SECRET,
    }),
  })
  const d = await res.json()
  writeFileSync(
    '.laofus-token-cache.json',
    JSON.stringify({ token: d.access_token, expiresAt: Date.now() + ((d.expires_in ?? 86400) - 60) * 1000, accountSeq: cache().accountSeq }),
    { mode: 0o600 }
  )
  return d.access_token
}
async function request(method, path, body) {
  const c = cache()
  let token = c.token && Date.now() < c.expiresAt ? c.token : await freshToken()
  const go = (t) => {
    const headers = { Authorization: `Bearer ${t}`, 'X-Tossinvest-Account': String(cache().accountSeq) }
    const init = { method, headers }
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json'
      init.body = JSON.stringify(body)
    }
    return fetch(`${BASE}${path}`, init)
  }
  let res = await go(token)
  if (res.status === 401) res = await go(await freshToken())
  if (!res.ok) throw new Error(`${method} ${path} ${res.status}: ${await res.text()}`)
  return (await res.json()).result
}

function msUntilKst(hhmm) {
  const [h, m] = hhmm.split(':').map(Number)
  const now = new Date()
  const kstNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }))
  const target = new Date(kstNow)
  target.setHours(h, m, 0, 0)
  if (target <= kstNow) target.setDate(target.getDate() + 1)
  return target.getTime() - kstNow.getTime()
}

const wait = msUntilKst(SELL_AT)
log(`AAPL 전량 매도 예약 — ${SELL_AT} KST (${Math.round(wait / 60000)}분 후)`)
await new Promise((r) => setTimeout(r, wait))

const holdings = await request('GET', '/api/v1/holdings?symbol=AAPL')
const aapl = holdings.items.find((i) => i.symbol === 'AAPL')
if (!aapl || Number(aapl.quantity) <= 0) {
  log('AAPL 보유 없음 — 종료')
  process.exit(0)
}
const qty = Number(aapl.quantity).toFixed(6)
log(`보유 ${qty}주 매도 주문`)
const placed = await request('POST', '/api/v1/orders', {
  symbol: 'AAPL',
  side: 'SELL',
  orderType: 'MARKET',
  quantity: qty,
  clientOrderId: `cleanup-aapl-${Date.now()}`,
})
log(`접수: ${placed.orderId} status=${placed.status}`)
for (let i = 0; i < 20; i++) {
  await new Promise((r) => setTimeout(r, 15_000))
  const o = await request('GET', `/api/v1/orders/${placed.orderId}`)
  if (o.status === 'FILLED') {
    log(`체결: ${o.execution.filledQuantity}주 @ $${o.execution.averageFilledPrice} = $${o.execution.filledAmount}`)
    process.exit(0)
  }
  if (['CANCELED', 'REJECTED'].includes(o.status)) {
    log(`실패: ${o.status}`)
    process.exit(1)
  }
}
log('5분 내 미체결 — 앱에서 확인 필요')
process.exit(1)
