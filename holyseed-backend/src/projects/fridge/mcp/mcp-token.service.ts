import { randomBytes } from 'crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FridgeMcpToken } from '../entities';

@Injectable()
export class FridgeMcpTokenService {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(FridgeMcpToken) private readonly tokenRepo: Repository<FridgeMcpToken>,
  ) {}

  private view(row: FridgeMcpToken) {
    const baseUrl = this.configService.get<string>('app.publicBaseUrl');
    return {
      id: row.id,
      label: row.label,
      lastUsedAt: row.lastUsedAt,
      createdAt: row.createdAt,
      connectorUrl: `${baseUrl}/api/fridge/mcp/${row.token}`,
    };
  }

  async list(userId: number) {
    const rows = await this.tokenRepo.find({ where: { userId }, order: { createdAt: 'DESC' } });
    return rows.map((r) => this.view(r));
  }

  async create(userId: number, label?: string) {
    const token = randomBytes(24).toString('hex');
    const row = await this.tokenRepo.save(this.tokenRepo.create({ userId, token, label: label?.trim() || null }));
    return this.view(row);
  }
}
