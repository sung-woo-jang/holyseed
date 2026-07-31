import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssetSnapshot } from './entities/asset-snapshot.entity';
import { UpsertSnapshotDto } from './dto/request/upsert-snapshot.dto';
import { BatchUpsertSnapshotsDto } from './dto/request/batch-upsert-snapshots.dto';
import { DeleteSnapshotDto } from './dto/request/delete-snapshot.dto';
import { Asset } from '../assets/entities/asset.entity';
import { Membership, MemberRole } from '../memberships/entities/membership.entity';

@Injectable()
export class AssetSnapshotsService {
  constructor(
    @InjectRepository(AssetSnapshot)
    private readonly snapshotRepo: Repository<AssetSnapshot>,
    @InjectRepository(Asset)
    private readonly assetRepo: Repository<Asset>,
    @InjectRepository(Membership)
    private readonly membershipRepo: Repository<Membership>,
  ) {}

  /** EDITOR 이상 + (본인 소유 또는 공동 소유)여야 해당 자산의 스냅샷을 건드릴 수 있다 */
  private async assertCanModify(assetId: number, userId: number): Promise<void> {
    const asset = await this.assetRepo.findOne({ where: { id: assetId } });
    if (!asset) throw new NotFoundException('자산을 찾을 수 없습니다.');
    const membership = await this.membershipRepo.findOne({ where: { householdId: asset.householdId, userId } });
    if (!membership || membership.role === MemberRole.VIEWER) {
      throw new ForbiddenException('이 자산의 스냅샷을 입력할 권한이 없습니다.');
    }
    if (asset.ownerUserId != null && asset.ownerUserId !== userId) {
      throw new ForbiddenException('본인 소유 자산만 스냅샷을 입력할 수 있어요.');
    }
  }

  async findByAsset(assetId: number): Promise<AssetSnapshot[]> {
    return this.snapshotRepo.find({
      where: { assetId },
      order: { date: 'DESC' },
    });
  }

  async upsert(assetId: number, dto: UpsertSnapshotDto, userId: number): Promise<AssetSnapshot> {
    await this.assertCanModify(assetId, userId);
    const existing = await this.snapshotRepo.findOne({ where: { assetId, date: dto.date } });
    const fxRate = dto.fxRateToKRW ?? 1;
    const valueKRW = dto.value * fxRate;

    if (existing) {
      Object.assign(existing, {
        value: dto.value,
        fxRateToKRW: fxRate,
        valueKRW,
        note: dto.note,
        createdByUserId: userId,
      });
      return this.snapshotRepo.save(existing);
    }

    const snapshot = this.snapshotRepo.create({
      assetId,
      date: dto.date,
      value: dto.value,
      fxRateToKRW: fxRate,
      valueKRW,
      note: dto.note,
      createdByUserId: userId,
    });
    return this.snapshotRepo.save(snapshot);
  }

  /** 권한 없는 항목은 조용히 건너뛴다 (프론트가 애초에 본인이 건드릴 수 있는 자산만 보내주는 게 정상 흐름) */
  async batchUpsert(householdId: number, dto: BatchUpsertSnapshotsDto, userId: number): Promise<AssetSnapshot[]> {
    const results: AssetSnapshot[] = [];
    for (const item of dto.items) {
      try {
        const snapshot = await this.upsert(item.assetId, item, userId);
        results.push(snapshot);
      } catch (e) {
        if (!(e instanceof ForbiddenException)) throw e;
      }
    }
    return results;
  }

  async delete(assetId: number, dto: DeleteSnapshotDto, userId: number): Promise<void> {
    await this.assertCanModify(assetId, userId);
    const snapshot = await this.snapshotRepo.findOne({ where: { assetId, date: dto.date } });
    if (!snapshot) throw new NotFoundException('스냅샷을 찾을 수 없습니다.');
    await this.snapshotRepo.remove(snapshot);
  }
}
