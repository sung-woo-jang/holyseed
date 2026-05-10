import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { RecurringTransactionsService } from './recurring-transactions.service';

@Injectable()
export class RecurringTransactionsCron {
  constructor(private readonly recurringService: RecurringTransactionsService) {}

  @Cron('0 1 * * *', { timeZone: 'Asia/Seoul' })
  async handleDailyRun(): Promise<void> {
    await this.recurringService.runDailyAll();
  }
}
