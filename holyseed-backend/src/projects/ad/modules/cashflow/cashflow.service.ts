import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from '../transactions/entities/transaction.entity';
import { CashflowQueryDto } from './dto/request/cashflow-query.dto';

@Injectable()
export class CashflowService {
  constructor(
    @InjectRepository(Transaction)
    private readonly txRepo: Repository<Transaction>,
  ) {}

  async getCashflow(householdId: number, dto: CashflowQueryDto) {
    const rows: { month: string; type: string; total: string }[] = await this.txRepo.manager.query(
      `SELECT to_char(date_trunc('month', date::timestamp), 'YYYY-MM') AS month,
              type,
              SUM(amount) AS total
       FROM ad.transactions
       WHERE household_id = $1
         AND date >= $2
         AND date <= $3
       GROUP BY month, type
       ORDER BY month, type`,
      [householdId, dto.from, dto.to],
    );

    const monthMap = new Map<string, { income: number; expense: number }>();
    for (const row of rows) {
      if (!monthMap.has(row.month)) monthMap.set(row.month, { income: 0, expense: 0 });
      const m = monthMap.get(row.month)!;
      if (row.type === 'INCOME') m.income = Number(row.total);
      else if (row.type === 'EXPENSE') m.expense = Number(row.total);
    }

    return Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, { income, expense }]) => ({
        month,
        income,
        expense,
        net: income - expense,
        savingsRate: income > 0 ? Number((((income - expense) / income) * 100).toFixed(1)) : null,
      }));
  }
}
