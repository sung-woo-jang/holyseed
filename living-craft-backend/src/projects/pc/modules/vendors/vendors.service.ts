import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vendor } from './entities/vendor.entity';
import { CreateVendorDto } from './dto/request/create-vendor.dto';
import { UpdateVendorDto } from './dto/request/update-vendor.dto';

@Injectable()
export class VendorsService {
  constructor(
    @InjectRepository(Vendor)
    private readonly repo: Repository<Vendor>,
  ) {}

  async findAll(): Promise<Vendor[]> {
    return this.repo.find({ order: { sortOrder: 'ASC', name: 'ASC' } });
  }

  async findOne(id: number): Promise<Vendor> {
    const vendor = await this.repo.findOne({ where: { id } });
    if (!vendor) throw new NotFoundException('업체를 찾을 수 없습니다.');
    return vendor;
  }

  async findByName(name: string): Promise<Vendor | null> {
    return this.repo.findOne({ where: { name: name.trim().normalize('NFC') } });
  }

  async create(dto: CreateVendorDto): Promise<Vendor> {
    const normalizedName = dto.name.trim().normalize('NFC');
    const existing = await this.repo.findOne({ where: { name: normalizedName } });
    if (existing) throw new ConflictException('동일한 업체명이 이미 존재합니다.');

    const vendor = this.repo.create({ ...dto, name: normalizedName, isActive: dto.isActive ?? true, sortOrder: dto.sortOrder ?? 0 });
    return this.repo.save(vendor);
  }

  async update(id: number, dto: UpdateVendorDto): Promise<Vendor> {
    const vendor = await this.findOne(id);
    if (dto.name) {
      const normalizedName = dto.name.trim().normalize('NFC');
      const dup = await this.repo.findOne({ where: { name: normalizedName } });
      if (dup && dup.id !== id) throw new ConflictException('동일한 업체명이 이미 존재합니다.');
      dto.name = normalizedName;
    }
    Object.assign(vendor, dto);
    return this.repo.save(vendor);
  }

  async delete(id: number): Promise<void> {
    await this.findOne(id);
    await this.repo.delete(id);
  }

  async findOrCreate(name: string): Promise<Vendor> {
    const normalizedName = name.trim().normalize('NFC');
    const existing = await this.repo.findOne({ where: { name: normalizedName } });
    if (existing) return existing;
    return this.repo.save(this.repo.create({ name: normalizedName, isActive: true, sortOrder: 0 }));
  }
}
