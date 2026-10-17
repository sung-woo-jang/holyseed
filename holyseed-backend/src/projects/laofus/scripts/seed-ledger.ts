/**
 * 토스증권 원장 적재 — 정리된 JSON 파일(행 배열)을 laofus.ledger_entries에 upsert(원장ID 기준, 몇 번을 돌려도 같은 결과).
 * 입출금·거래 내역은 토스 Open API로 조회할 수 없어서 토스 웹 내역을 정리한 파일을 넣는다. 개인 금융 데이터라 레포에 두지 않는다.
 *
 * 실행: DB_DATABASE=holyseed yarn laofus:seed-ledger <rows.json>
 *   rows.json 행: { ledgerId, occurredAt(ISO), currency, category, stockName?, stockCode?, quantityDelta?, cashDelta?,
 *                   tradeAmount?, commission?, tax?, balanceAfter?, status, settleDate?, sourceSummary, memo? }
 */
import { readFileSync } from 'node:fs';
import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '../../../app.module';
import { LaofusLedgerEntry } from '../entities/ledger-entry.entity';

interface SeedRow {
  ledgerId: string;
  occurredAt: string;
  currency: 'KRW' | 'USD';
  category: string;
  stockName?: string | null;
  stockCode?: string | null;
  quantityDelta?: number | null;
  cashDelta?: number | null;
  tradeAmount?: number | null;
  commission?: number | null;
  tax?: number | null;
  balanceAfter?: number | null;
  status: string;
  settleDate?: string | null;
  sourceSummary: string;
  memo?: string | null;
}

const str = (v: number | null | undefined): string | null => (v === null || v === undefined ? null : String(v));

async function main() {
  const file = process.argv[2];
  if (!file) throw new Error('사용법: yarn laofus:seed-ledger <rows.json>');
  const rows: SeedRow[] = JSON.parse(readFileSync(file, 'utf8'));
  if (!Array.isArray(rows) || rows.length === 0) throw new Error('행이 비어 있습니다');

  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  const ds = app.get(DataSource);
  const repo = ds.getRepository(LaofusLedgerEntry);

  const entities = rows.map((r) =>
    repo.create({
      ledgerId: r.ledgerId,
      occurredAt: new Date(r.occurredAt),
      currency: r.currency,
      category: r.category,
      stockName: r.stockName ?? null,
      stockCode: r.stockCode ?? null,
      quantityDelta: str(r.quantityDelta),
      cashDelta: str(r.cashDelta),
      tradeAmount: str(r.tradeAmount),
      commission: str(r.commission),
      tax: str(r.tax),
      balanceAfter: str(r.balanceAfter),
      status: r.status,
      settleDate: r.settleDate ?? null,
      sourceSummary: r.sourceSummary,
      memo: r.memo ?? null,
    }),
  );

  const before = await repo.count();
  for (let i = 0; i < entities.length; i += 100) {
    await repo.upsert(entities.slice(i, i + 100), ['ledgerId']);
  }
  const after = await repo.count();
  console.log(`원장 적재 완료: 입력 ${rows.length}건, 테이블 ${before} → ${after}건`);
  await app.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
