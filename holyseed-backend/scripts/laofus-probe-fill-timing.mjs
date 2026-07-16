/**
 * 소수점 금액주문(orderAmount) 당일 체결 컷오프 탐색 프로브 — 1회성.
 *
 * 배경: 2026-07-16 04:30(마감 30분 전) SOXL $49.8 금액주문이 당일 체결되지 않고
 * 다음 세션 개장으로 이월됨. 장중 주문은 당일 체결되는지, 컷오프가 몇 시인지 확인한다.
 *
 * 동작: 오늘 밤 세션(EDT: KST 22:30~05:00) 중 5개 시각에 AAPL $1 매수를 넣고
 * 각 주문의 체결 시각을 폴링 기록 → .laofus-probe-results.json.
 * SOXL을 안 쓰는 이유: 엔진의 계좌-DB 보유수량 정합성 가드를 건드리지 않기 위함.
 * 엔진 cron(04:30/05:30)·회수 cron(22:40/23:40)과 ±10분 겹치지 않게 시각 선정.
 *
 * 실행: node scripts/laofus-probe-fill-timing.mjs  (cwd: holyseed-backend — 토큰 캐시 공유)
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const BASE = 'https://openapi.tossinvest.com'
const CACHE = resolve(process.cwd(), '.laofus-token-cache.json')
const OUT = resolve(process.cwd(), '.laofus-probe-results.json')
const SYMBOL = 'AAPL'
const AMOUNTS = ['1', '2', '5'] // $1 거부되면 단계적 재시도
const PROBE_TIMES = ['22:50', '00:30', '02:30', '03:55', '04:20'] // KST
const FINAL_CHECK = '04:58' // 마감 직전 전체 재확인

// ---- env ----
for (const line of readFileSync(resolve(process.cwd(), '.env'), 'utf8').split('\n')) {
  const t = line.trim()
  if (!t || t.startsWith('#') || !t.includes('=')) continue
  const i = t.indexOf('=')
  if (!process.env[t.slice(0, i)]) process.env[t.slice(0, i)] = t.slice(i + 1).trim()
}
const CLIENT_ID = process.env.TOSS_CLIENT_ID
const CLIENT_SECRET = process.env.TOSS_CLIENT_SECRET
if (!CLIENT_ID || !CLIENT_SECRET) throw new Error('TOSS_CLIENT_ID/SECRET 미설정')

// ---- 결과 파일 ----
let results = { startedAt: new Date().toISOString(), probes: [] }
try {
  results = JSON.parse(readFileSync(OUT, 'utf8'))
} catch {
  /* 새 파일 */
}
const save = () => writeFileSync(OUT, JSON.stringify(results, null, 2))

const log = (m) => console.log(`[${new Date().toISOString()}] ${m}`)

// ---- 토큰: 캐시 공유 (백엔드와 핑퐁 최소화 — 401 시 캐시 재읽기 → 그래도 실패면 재발급) ----
function readCache() {
  try {
    return JSON.parse(readFileSync(CACHE, 'utf8'))
  } catch {
    return null
  }
}
async function fetchToken() {
  const res = await fetch(`${BASE}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'client_credentials', client_id: CLIENT_ID, client_secret: CLIENT_SECRET }),
  })
  if (!res.ok) throw new Error(`토큰 발급 실패 ${res.status}`)
  const d = await res.json()
  const cache = { token: d.access_token, expiresAt: Date.now() + ((d.expires_in ?? 86400) - 60) * 1000, accountSeq: readCache()?.accountSeq ?? null }
  writeFileSync(CACHE, JSON.stringify(cache), { mode: 0o600 })
  return cache.token
}
async function request(method, path, { params, body, withAccount } = {}, _retried = false) {
  const cache = readCache()
  let token = cache?.token && Date.now() < cache.expiresAt ? cache.token : await fetchToken()
  const headers = { Authorization: `Bearer ${token}` }
  if (withAccount) headers['X-Tossinvest-Account'] = String(readCache()?.accountSeq)
  let url = `${BASE}${path}`
  if (params) url += `?${new URLSearchParams(params)}`
  const init = { method, headers }
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    init.body = JSON.stringify(body)
  }
  let res = await fetch(url, init)
  if (res.status === 401 && !_retried) {
    const fresh = readCache() // 백엔드가 재발급해뒀을 수 있음
    if (fresh?.token && fresh.token !== token) {
      headers.Authorization = `Bearer ${fresh.token}`
    } else {
      headers.Authorization = `Bearer ${await fetchToken()}`
    }
    res = await fetch(url, init)
  }
  if (!res.ok) {
    const text = await res.text()
    const err = new Error(`${method} ${path} ${res.status}: ${text}`)
    err.status = res.status
    throw err
  }
  return (await res.json()).result
}

// ---- 스케줄 ----
function nextKst(hhmm) {
  const [h, m] = hhmm.split(':').map(Number)
  const now = new Date()
  const kstNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }))
  const target = new Date(kstNow)
  target.setHours(h, m, 0, 0)
  if (target <= kstNow) target.setDate(target.getDate() + 1)
  return now.getTime() + (target.getTime() - kstNow.getTime())
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function placeProbe(slot) {
  const day = new Date().toISOString().slice(0, 10).replaceAll('-', '')
  for (const amt of AMOUNTS) {
    const clientOrderId = `probe-${day}-${slot.replace(':', '')}-${amt}`
    try {
      const order = await request('POST', '/api/v1/orders', {
        body: { symbol: SYMBOL, side: 'BUY', orderType: 'MARKET', orderAmount: amt, clientOrderId },
        withAccount: true,
      })
      return { order, amt }
    } catch (e) {
      log(`주문 $${amt} 실패: ${e.message.slice(0, 200)}`)
      if (e.status !== 400) throw e // 400(금액 미달 등)만 다음 금액 재시도
    }
  }
  return null
}

async function pollOrder(orderId, timeoutMin = 20) {
  const start = Date.now()
  while (Date.now() - start < timeoutMin * 60_000) {
    const o = await request('GET', `/api/v1/orders/${orderId}`, { withAccount: true })
    if (o.status === 'FILLED' || ['CANCELED', 'REJECTED'].includes(o.status)) return o
    await sleep(30_000)
  }
  return await request('GET', `/api/v1/orders/${orderId}`, { withAccount: true })
}

async function runProbe(slot) {
  log(`--- 프로브 ${slot} ---`)
  const rec = { slot, placedAtKst: new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Seoul' }) }
  try {
    const placed = await placeProbe(slot)
    if (!placed) {
      rec.error = '모든 금액 거부'
    } else {
      rec.orderId = placed.order.orderId
      rec.amount = placed.amt
      rec.orderedAt = placed.order.orderedAt // 이월 여부 핵심 지표
      rec.initialStatus = placed.order.status
      log(`접수: $${placed.amt} orderedAt=${placed.order.orderedAt} status=${placed.order.status}`)
      const final = await pollOrder(placed.order.orderId)
      rec.finalStatus = final.status
      rec.filledAt = final.execution?.filledAt ?? null
      rec.filledPrice = final.execution?.averageFilledPrice ?? null
      log(`20분 후: status=${final.status} filledAt=${rec.filledAt}`)
    }
  } catch (e) {
    rec.error = String(e.message ?? e).slice(0, 300)
    log(`오류: ${rec.error}`)
  }
  results.probes.push(rec)
  save()
}

async function finalCheck() {
  log('--- 마감 직전 전체 재확인 ---')
  for (const rec of results.probes) {
    if (!rec.orderId || rec.finalStatus === 'FILLED') continue
    try {
      const o = await request('GET', `/api/v1/orders/${rec.orderId}`, { withAccount: true })
      rec.finalStatus = o.status
      rec.filledAt = o.execution?.filledAt ?? null
      rec.orderedAtFinal = o.orderedAt
      log(`${rec.slot}: ${o.status} filledAt=${rec.filledAt} orderedAt=${o.orderedAt}`)
    } catch (e) {
      log(`${rec.slot} 재확인 실패: ${e.message?.slice(0, 100)}`)
    }
  }
  results.finishedAt = new Date().toISOString()
  save()
  log(`완료 — 결과: ${OUT}`)
}

// ---- main ----
const jobs = PROBE_TIMES.map((t) => ({ t, at: nextKst(t) })).sort((a, b) => a.at - b.at)
log(`프로브 예약: ${jobs.map((j) => `${j.t}(${new Date(j.at).toLocaleTimeString('ko-KR', { timeZone: 'Asia/Seoul' })})`).join(', ')}`)
for (const j of jobs) {
  const wait = j.at - Date.now()
  if (wait > 0) await sleep(wait)
  await runProbe(j.t)
}
const finalAt = nextKst(FINAL_CHECK)
if (finalAt - Date.now() > 0) await sleep(finalAt - Date.now())
await finalCheck()
process.exit(0)
