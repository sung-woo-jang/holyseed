import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { LedgerAsset, LedgerCategory, LedgerTransaction, LedgerType } from './entities';
import {
  CreateAssetDto,
  CreateCategoryDto,
  CreateTransactionDto,
  SearchTransactionDto,
  UpdateAssetDto,
  UpdateCategoryDto,
  UpdateTransactionDto,
} from './dto/request';

@Injectable()
export class LedgerService {
  constructor(
    @InjectRepository(LedgerCategory)
    private readonly categoryRepo: Repository<LedgerCategory>,
    @InjectRepository(LedgerAsset)
    private readonly assetRepo: Repository<LedgerAsset>,
    @InjectRepository(LedgerTransaction)
    private readonly txRepo: Repository<LedgerTransaction>,
  ) {}

  // ─── Categories ───────────────────────────────────────────────────────────

  async getCategories(): Promise<LedgerCategory[]> {
    return this.categoryRepo.find({ order: { type: 'ASC', id: 'ASC' } });
  }

  async createCategory(dto: CreateCategoryDto): Promise<LedgerCategory> {
    const category = this.categoryRepo.create({ ...dto, costType: dto.costType ?? null });
    return this.categoryRepo.save(category);
  }

  async updateCategory(id: number, dto: UpdateCategoryDto): Promise<LedgerCategory> {
    const category = await this.categoryRepo.findOne({ where: { id } });
    if (!category) throw new NotFoundException('카테고리를 찾을 수 없습니다.');
    Object.assign(category, dto);
    return this.categoryRepo.save(category);
  }

  async deleteCategory(id: number): Promise<void> {
    const category = await this.categoryRepo.findOne({ where: { id } });
    if (!category) throw new NotFoundException('카테고리를 찾을 수 없습니다.');
    await this.categoryRepo.remove(category);
  }

  // ─── Assets ───────────────────────────────────────────────────────────────

  async getAssets(): Promise<LedgerAsset[]> {
    return this.assetRepo.find({ order: { id: 'ASC' } });
  }

  async createAsset(dto: CreateAssetDto): Promise<LedgerAsset> {
    const asset = this.assetRepo.create({ name: dto.name, type: dto.type, balance: dto.balance ?? 0 });
    return this.assetRepo.save(asset);
  }

  async updateAsset(id: number, dto: UpdateAssetDto): Promise<LedgerAsset> {
    const asset = await this.assetRepo.findOne({ where: { id } });
    if (!asset) throw new NotFoundException('자산을 찾을 수 없습니다.');
    Object.assign(asset, dto);
    return this.assetRepo.save(asset);
  }

  async deleteAsset(id: number): Promise<void> {
    const asset = await this.assetRepo.findOne({ where: { id } });
    if (!asset) throw new NotFoundException('자산을 찾을 수 없습니다.');
    await this.assetRepo.remove(asset);
  }

  // ─── Transactions ─────────────────────────────────────────────────────────

  async findAllTransactions(): Promise<LedgerTransaction[]> {
    return this.txRepo.find({ order: { date: 'DESC', id: 'DESC' } });
  }

  async search(dto: SearchTransactionDto) {
    const from = `${dto.year}-${String(dto.month).padStart(2, '0')}-01`;
    const lastDay = new Date(Date.UTC(dto.year, dto.month, 0)).getUTCDate();
    const to = `${dto.year}-${String(dto.month).padStart(2, '0')}-${lastDay}`;

    const [records, categories, assets] = await Promise.all([
      this.txRepo.find({ where: { date: Between(from, to) }, order: { date: 'ASC', id: 'ASC' } }),
      this.categoryRepo.find(),
      this.assetRepo.find(),
    ]);

    const catMap = new Map(categories.map((c) => [c.id, c]));
    const assetMap = new Map(assets.map((a) => [a.id, a]));

    const enrichedRecords = records.map((r) => ({
      ...r,
      category: r.categoryId != null ? (catMap.get(r.categoryId) ?? null) : null,
      asset: r.assetId != null ? (assetMap.get(r.assetId) ?? null) : null,
    }));

    const incomes = records.filter((r) => r.type === LedgerType.INCOME);
    const expenses = records.filter((r) => r.type === LedgerType.EXPENSE);
    const sum = (rows: LedgerTransaction[]) => rows.reduce((acc, r) => acc + r.amount, 0);

    const totalIncome = sum(incomes);
    const totalExpense = sum(expenses);
    const netCashflow = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? Math.round((netCashflow / totalIncome) * 100) : 0;

    const byCategoryMap = new Map<number, number>();
    for (const r of expenses) {
      if (r.categoryId == null) continue;
      byCategoryMap.set(r.categoryId, (byCategoryMap.get(r.categoryId) ?? 0) + r.amount);
    }
    const byCategory = Array.from(byCategoryMap.entries())
      .map(([categoryId, amount]) => {
        const cat = catMap.get(categoryId);
        return { categoryId, name: cat?.name ?? '기타', color: cat?.color ?? '#94A3B8', amount };
      })
      .sort((a, b) => b.amount - a.amount);

    return {
      records: enrichedRecords,
      categories,
      assets,
      summary: { totalIncome, totalExpense, netCashflow, savingsRate, byCategory },
    };
  }

  /** 거래 등록/수정/삭제 시 연결된 자산의 잔액에 반영 (sign: 1=적용, -1=되돌리기) */
  private async applyAssetDelta(assetId: number | null, type: LedgerType, amount: number, sign: 1 | -1): Promise<void> {
    if (assetId == null) return;
    const asset = await this.assetRepo.findOne({ where: { id: assetId } });
    if (!asset) return;
    const effect = type === LedgerType.INCOME ? amount : -amount;
    asset.balance += sign * effect;
    await this.assetRepo.save(asset);
  }

  async createTransaction(dto: CreateTransactionDto): Promise<LedgerTransaction> {
    const tx = this.txRepo.create({
      ...dto,
      categoryId: dto.categoryId ?? null,
      assetId: dto.assetId ?? null,
      title: dto.title ?? null,
      memo: dto.memo ?? null,
    });
    const saved = await this.txRepo.save(tx);
    await this.applyAssetDelta(saved.assetId, saved.type, saved.amount, 1);
    return saved;
  }

  async updateTransaction(id: number, dto: UpdateTransactionDto): Promise<LedgerTransaction> {
    const tx = await this.txRepo.findOne({ where: { id } });
    if (!tx) throw new NotFoundException('거래를 찾을 수 없습니다.');
    const old = { assetId: tx.assetId, type: tx.type, amount: tx.amount };
    Object.assign(tx, dto);
    const saved = await this.txRepo.save(tx);
    await this.applyAssetDelta(old.assetId, old.type, old.amount, -1);
    await this.applyAssetDelta(saved.assetId, saved.type, saved.amount, 1);
    return saved;
  }

  async deleteTransaction(id: number): Promise<void> {
    const tx = await this.txRepo.findOne({ where: { id } });
    if (!tx) throw new NotFoundException('거래를 찾을 수 없습니다.');
    await this.applyAssetDelta(tx.assetId, tx.type, tx.amount, -1);
    await this.txRepo.remove(tx);
  }
}
