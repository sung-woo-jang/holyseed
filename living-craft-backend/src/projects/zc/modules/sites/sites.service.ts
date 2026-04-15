import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Site } from './entities/site.entity';

@Injectable()
export class SitesService {
  constructor(
    @InjectRepository(Site)
    private readonly siteRepository: Repository<Site>,
  ) {}

  async findAll(): Promise<Site[]> {
    return await this.siteRepository.find();
  }

  async findByCode(code: string): Promise<Site | null> {
    return await this.siteRepository.findOne({ where: { code } });
  }

  async findById(id: string): Promise<Site | null> {
    return await this.siteRepository.findOne({ where: { id } });
  }
}
