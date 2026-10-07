import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Like, Repository } from 'typeorm';
import { Asset, AssetCategory } from './entities/asset.entity';
import { AssetSnapshot } from '../asset-snapshots/entities/asset-snapshot.entity';
import { CreateAssetDto } from './dto/request/create-asset.dto';
import { SearchAssetsDto } from './dto/request/search-assets.dto';
import { Membership, MemberRole } from '../memberships/entities/membership.entity';

@Injectable()
export class AssetsService {
  constructor(
    @InjectRepository(Asset)
    private readonly assetRepo: Repository<Asset>,
    @InjectRepository(Membership)
    private readonly membershipRepo: Repository<Membership>,
  ) {}

  /** EDITOR 이상 + (본인 소유 또는 공동 소유)여야 자산을 수정/삭제할 수 있다 */
  private async assertCanModify(asset: Asset, userId: number): Promise<void> {
    const membership = await this.membershipRepo.findOne({ where: { householdId: asset.householdId, userId } });
    if (!membership || membership.role === MemberRole.VIEWER) {
      throw new ForbiddenException('이 자산을 수정할 권한이 없습니다.');
    }
    if (asset.ownerUserId != null && asset.ownerUserId !== userId) {
      throw new ForbiddenException('본인 소유 자산만 수정할 수 있어요.');
    }
  }

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

  /** 자산 상세 조회 — 그 가구의 멤버만 */
  async findOneForMember(id: number, userId: number): Promise<Asset> {
    const asset = await this.findOne(id);
    const m = await this.membershipRepo.findOne({ where: { householdId: asset.householdId, userId } });
    if (!m) throw new ForbiddenException('이 자산을 볼 권한이 없습니다.');
    return asset;
  }

  async create(householdId: number, dto: CreateAssetDto, userId: number): Promise<Asset> {
    const ownerUserId = dto.ownerUserId !== undefined ? dto.ownerUserId : userId;
    // 부채 여부는 카테고리에서 파생 — 클라이언트가 보낸 값과 어긋나면 순자산 부호가 틀어진다
    const asset = this.assetRepo.create({
      ...dto,
      householdId,
      ownerUserId,
      isLiability: dto.category === AssetCategory.DEBT,
    });
    return this.assetRepo.save(asset);
  }

  async update(id: number, dto: Partial<CreateAssetDto>, userId: number): Promise<Asset> {
    const asset = await this.findOne(id);
    await this.assertCanModify(asset, userId);
    Object.assign(asset, dto);
    if (dto.category !== undefined) asset.isLiability = dto.category === AssetCategory.DEBT;
    return this.assetRepo.save(asset);
  }

  async archive(id: number, userId: number): Promise<Asset> {
    const asset = await this.findOne(id);
    await this.assertCanModify(asset, userId);
    asset.archivedAt = new Date();
    return this.assetRepo.save(asset);
  }

  async delete(id: number, userId: number): Promise<void> {
    const asset = await this.findOne(id);
    await this.assertCanModify(asset, userId);
    // 스냅샷엔 외래키가 없어 자산만 지우면 고아 행으로 남는다 — 앱 확인창 안내대로 기록도 함께 지운다
    await this.assetRepo.manager.transaction(async (m) => {
      await m.delete(AssetSnapshot, { assetId: asset.id });
      await m.remove(asset);
    });
  }
}
