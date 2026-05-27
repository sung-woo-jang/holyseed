import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SiteAsset } from './entities/site-asset.entity';

@Injectable()
export class SiteAssetsService {
  constructor(
    @InjectRepository(SiteAsset) private readonly repo: Repository<SiteAsset>,
  ) {}

  async getAll(): Promise<Record<string, SiteAsset>> {
    const assets = await this.repo.find();
    return Object.fromEntries(assets.map((a) => [a.key, a]));
  }

  async getByKey(key: string): Promise<SiteAsset | null> {
    return this.repo.findOne({ where: { key } });
  }

  async upsert(key: string, imageUrl: string, caption?: string): Promise<SiteAsset> {
    const existing = await this.repo.findOne({ where: { key } });
    if (existing) {
      existing.imageUrl = imageUrl;
      if (caption !== undefined) existing.caption = caption;
      return this.repo.save(existing);
    }
    return this.repo.save(this.repo.create({ key, imageUrl, caption }));
  }

  async updateCaption(key: string, caption: string): Promise<SiteAsset | null> {
    const asset = await this.repo.findOne({ where: { key } });
    if (!asset) return null;
    asset.caption = caption;
    return this.repo.save(asset);
  }
}
