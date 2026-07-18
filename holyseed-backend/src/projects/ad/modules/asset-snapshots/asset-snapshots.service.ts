import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssetSnapshot } from './entities/asset-snapshot.entity';
import { UpsertSnapshotDto } from './dto/request/upsert-snapshot.dto';
import { BatchUpsertSnapshotsDto } from './dto/request/batch-upsert-snapshots.dto';
import { DeleteSnapshotDto } from './dto/request/delete-snapshot.dto';

@Injectable()
export class AssetSnapshotsService {
  constructor(
    @InjectRepository(AssetSnapshot)
    private readonly snapshotRepo: Repository<AssetSnapshot>,
  ) {}

  async findByAsset(assetId: number): Promise<AssetSnapshot[]> {
    return this.snapshotRepo.find({
      where: { assetId },
      order: { date: 'DESC' },
    });
  }

  async upsert(assetId: number, dto: UpsertSnapshotDto, userId: number): Promise<AssetSnapshot> {
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

  async batchUpsert(householdId: number, dto: BatchUpsertSnapshotsDto, userId: number): Promise<AssetSnapshot[]> {
    const results: AssetSnapshot[] = [];
    for (const item of dto.items) {
      const snapshot = await this.upsert(item.assetId, item, userId);
      results.push(snapshot);
    }
    return results;
  }

  async delete(assetId: number, dto: DeleteSnapshotDto): Promise<void> {
    const snapshot = await this.snapshotRepo.findOne({ where: { assetId, date: dto.date } });
    if (!snapshot) throw new NotFoundException('스냅샷을 찾을 수 없습니다.');
    await this.snapshotRepo.remove(snapshot);
  }
}
