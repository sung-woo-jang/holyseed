import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { RecurringTransactionsService } from './recurring-transactions.service';

@Injectable()
export class RecurringTransactionsCron {
  constructor(private readonly recurringService: RecurringTransactionsService) {}

  @Cron('0 1 * * *', { timeZone: 'Asia/Seoul' })
  async handleDailyRun(): Promise<void> {
    // holyseed-backend는 pm2 cluster(instances:2)로 도는데, 가드 없인 워커마다 cron이 독립
    // 발화해 같은 정기거래가 중복 생성된다(2026-09-16 실제 발생, 3중복). pm2가 워커별로 주입하는
    // NODE_APP_INSTANCE로 0번 워커에서만 실행.
    if (process.env.NODE_APP_INSTANCE !== '0') return;
    await this.recurringService.runDailyAll();
  }
}
