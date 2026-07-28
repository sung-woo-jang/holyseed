import { randomBytes } from 'crypto';
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { McpToken } from './entities/mcp-token.entity';

@Injectable()
export class McpTokenService {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(McpToken)
    private readonly tokenRepo: Repository<McpToken>,
  ) {}

  private toDto(row: McpToken) {
    const baseUrl = this.configService.get('app.publicBaseUrl');
    return {
      id: row.id,
      token: row.token,
      label: row.label,
      lastUsedAt: row.lastUsedAt,
      createdAt: row.createdAt,
      connectorUrl: `${baseUrl}/api/ad/mcp/${row.token}`,
    };
  }

  async list(userId: number) {
    const rows = await this.tokenRepo.find({ where: { userId }, order: { createdAt: 'DESC' } });
    return rows.map((row) => this.toDto(row));
  }

  async create(userId: number, label?: string) {
    const token = randomBytes(24).toString('hex');
    const row = await this.tokenRepo.save(this.tokenRepo.create({ userId, token, label: label ?? null }));
    return this.toDto(row);
  }

  async delete(userId: number, id: number): Promise<void> {
    const row = await this.tokenRepo.findOne({ where: { id } });
    if (!row) throw new NotFoundException('토큰을 찾을 수 없습니다.');
    if (Number(row.userId) !== Number(userId)) throw new ForbiddenException('본인 토큰만 삭제할 수 있습니다.');
    await this.tokenRepo.remove(row);
  }
}
