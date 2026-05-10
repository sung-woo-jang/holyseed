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

  async findByHousehold(householdId: number): Promise<Asset[]> {
    return this.assetRepo.find({
      where: { householdId, archivedAt: IsNull() },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
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
