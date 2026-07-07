import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Like, Repository } from 'typeorm';
import { Asset } from './entities/asset.entity';
import { CreateAssetDto } from './dto/request/create-asset.dto';
import { SearchAssetsDto } from './dto/request/search-assets.dto';

@Injectable()
export class AssetsService {
  constructor(
    @InjectRepository(Asset)
    private readonly assetRepo: Repository<Asset>,
  ) {}

  async findByHousehold(householdId: number) {
    const assets = await this.assetRepo.find({
      where: { householdId, archivedAt: IsNull() },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });
    if (!assets.length) return [];
    const ids = assets.map((a) => a.id);
    // 자산당 최신 2건 — rn=1 최신, rn=2 직전 (증감 계산용)
    const rows: any[] = await this.assetRepo.manager.query(
      `SELECT * FROM (
         SELECT s.asset_id, s.value, s.fx_rate_to_krw, s.value_krw,
                to_char(s.date, 'YYYY-MM-DD') AS date,
                ROW_NUMBER() OVER (PARTITION BY s.asset_id ORDER BY s.date DESC) AS rn
         FROM ad.asset_snapshots s
         WHERE s.asset_id = ANY($1)
       ) t WHERE t.rn <= 2`,
      [ids],
    );
    const toSnapshot = (r: any) => ({
      value: Number(r.value),
      fxRateToKRW: Number(r.fx_rate_to_krw),
      valueKRW: Number(r.value_krw),
      date: r.date,
    });
    const latestMap = new Map(rows.filter((r) => Number(r.rn) === 1).map((r) => [r.asset_id, r]));
    const prevMap = new Map(rows.filter((r) => Number(r.rn) === 2).map((r) => [r.asset_id, r]));
    return assets.map((a) => {
      const latest = latestMap.get(a.id);
      const prev = prevMap.get(a.id);
      return {
        ...a,
        latestSnapshot: latest ? toSnapshot(latest) : undefined,
        prevSnapshot: prev ? toSnapshot(prev) : undefined,
      };
    });
  }

  async search(householdId: number, dto: SearchAssetsDto): Promise<Asset[]> {
    const where: any = { householdId };
    if (!dto.includeArchived) where.archivedAt = IsNull();
    if (dto.category) where.category = dto.category;
    if (dto.keyword) where.name = Like(`%${dto.keyword}%`);
    return this.assetRepo.find({ where, order: { sortOrder: 'ASC' } });
  }

  async findOne(id: number): Promise<Asset> {
    const asset = await this.assetRepo.findOne({ where: { id } });
    if (!asset) throw new NotFoundException('자산을 찾을 수 없습니다.');
    return asset;
  }

  async create(householdId: number, dto: CreateAssetDto): Promise<Asset> {
    const asset = this.assetRepo.create({ ...dto, householdId });
    return this.assetRepo.save(asset);
  }

  async update(id: number, dto: Partial<CreateAssetDto>): Promise<Asset> {
    const asset = await this.findOne(id);
    Object.assign(asset, dto);
    return this.assetRepo.save(asset);
  }

  async archive(id: number): Promise<Asset> {
    const asset = await this.findOne(id);
    asset.archivedAt = new Date();
    return this.assetRepo.save(asset);
  }

  async delete(id: number): Promise<void> {
    const asset = await this.findOne(id);
    await this.assetRepo.remove(asset);
  }
}
