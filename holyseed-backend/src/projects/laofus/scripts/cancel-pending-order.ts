/**
 * laofus 미체결 주문 수동 취소 — 프롬프트로 요청 시 이 스크립트 실행.
 *
 * 하는 일:
 * 1. 토스에 실제 주문 취소 요청
 * 2. laofus.pending_orders에서 해당 row를 FAILED로 표시(reconcile()이 다시 안 건드리게)
 *
 * 실행: yarn laofus:cancel-order <orderId>
 */
import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '../../../app.module';
import { TossClientService } from '@shared/toss/toss-client.service';
import { LaofusPendingOrder } from '../entities/pending-order.entity';
import { LaofusEvent } from '../entities/event.entity';

async function main() {
  const orderId = process.argv[2];
  if (!orderId) {
    console.error('사용법: yarn laofus:cancel-order <orderId>');
    process.exit(1);
  }

  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  const ds = app.get(DataSource);
  const toss = app.get(TossClientService);

  const result = await toss.cancelOrder(orderId);
  console.log('토스 취소 완료:', result);

  const pendingRepo = ds.getRepository(LaofusPendingOrder);
  const eventRepo = ds.getRepository(LaofusEvent);
  const pending = await pendingRepo.findOne({ where: { orderId } });
  if (pending) {
    await pendingRepo.update({ id: pending.id }, { status: 'FAILED' });
    console.log(`pending_orders id=${pending.id} → FAILED 처리`);
  } else {
    console.log('pending_orders에 해당 orderId 없음(이미 정리됐거나 다른 주문)');
  }

  await eventRepo.save({
    level: 'info',
    source: 'engine',
    message: `수동 주문 취소: ${orderId}`,
  });

  await app.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
