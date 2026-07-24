import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Expense, ExpenseKind, ExpenseType } from './entities';
import { CreateExpenseDto, UpdateExpenseDto, SearchExpenseDto } from './dto/request';

const FIXED_TYPES = [ExpenseType.FIXED_SAME, ExpenseType.FIXED_VARIABLE];

@Injectable()
export class ExpenseService {
  constructor(
    @InjectRepository(Expense)
    private readonly expenseRepo: Repository<Expense>,
  ) {}

  async findAll(): Promise<Expense[]> {
    return this.expenseRepo.find({ order: { date: 'DESC', id: 'DESC' } });
  }

  async search(dto: SearchExpenseDto) {
    const from = `${dto.year}-${String(dto.month).padStart(2, '0')}-01`;
    const lastDay = new Date(Date.UTC(dto.year, dto.month, 0)).getUTCDate();
    const to = `${dto.year}-${String(dto.month).padStart(2, '0')}-${lastDay}`;

    const records = await this.expenseRepo.find({
      where: { date: Between(from, to) },
      order: { date: 'ASC', id: 'ASC' },
    });

    const expenses = records.filter((r) => r.kind === ExpenseKind.EXPENSE);
    const incomes = records.filter((r) => r.kind === ExpenseKind.INCOME);
    const sum = (rows: Expense[]) => rows.reduce((acc, r) => acc + r.amount, 0);

    const totalExpense = sum(expenses);
    const totalIncome = sum(incomes);
    const fixedExpenseTotal = sum(expenses.filter((r) => r.expenseType && FIXED_TYPES.includes(r.expenseType)));

    const byCategoryMap = new Map<string, number>();
    for (const r of expenses) {
      byCategoryMap.set(r.category, (byCategoryMap.get(r.category) ?? 0) + r.amount);
    }
    const byCategory = Array.from(byCategoryMap.entries())
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);

    return {
      records,
      summary: {
        totalIncome,
        totalExpense,
        netCashflow: totalIncome - totalExpense,
        fixedExpenseTotal,
        byCategory,
      },
    };
  }

  async create(dto: CreateExpenseDto): Promise<Expense> {
    const expense = this.expenseRepo.create({ ...dto, expenseType: dto.expenseType ?? null });
    return this.expenseRepo.save(expense);
  }

  async update(id: number, dto: UpdateExpenseDto): Promise<Expense> {
    const expense = await this.expenseRepo.findOne({ where: { id } });
    if (!expense) throw new NotFoundException('지출 기록을 찾을 수 없습니다.');
    Object.assign(expense, dto);
    return this.expenseRepo.save(expense);
  }

  async delete(id: number): Promise<void> {
    const expense = await this.expenseRepo.findOne({ where: { id } });
    if (!expense) throw new NotFoundException('지출 기록을 찾을 수 없습니다.');
    await this.expenseRepo.remove(expense);
  }
}
