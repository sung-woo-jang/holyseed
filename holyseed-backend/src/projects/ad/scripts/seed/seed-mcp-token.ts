/**
 * 고정 시크릿(AD_MCP_SECRET) → 계정별 발급 토큰(ad.mcp_tokens) 전환 마이그레이션.
 * 기존 AD_MCP_SECRET 값을 그대로 토큰으로 시딩해, 이미 claude.ai에 등록해둔
 * 커넥터 URL이 변경 없이 계속 동작하도록 한다.
 *
 * 실행: NODE_ENV=production yarn ad:mcp-token:seed
 */
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppModule } from '../../../../app.module';
import { AdUser } from '../../modules/users/entities/ad-user.entity';
import { McpToken } from '../../modules/mcp/entities/mcp-token.entity';

async function run() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const configService = app.get(ConfigService);
  const userRepo = app.get<Repository<AdUser>>(getRepositoryToken(AdUser));
  const tokenRepo = app.get<Repository<McpToken>>(getRepositoryToken(McpToken));

  const secret = configService.get('AD_MCP_SECRET');
  const email = (configService.get('AD_MCP_USER_EMAIL') || '').toLowerCase();
  if (!secret || !email) {
    throw new Error('AD_MCP_SECRET / AD_MCP_USER_EMAIL이 설정되어 있지 않습니다.');
  }

  const user = await userRepo.findOne({ where: { email } });
  if (!user) throw new Error(`계정(${email})을 찾을 수 없습니다.`);

  const existing = await tokenRepo.findOne({ where: { token: secret } });
  if (existing) {
    console.log('이미 시딩되어 있습니다:', existing.id);
    await app.close();
    return;
  }

  const row = await tokenRepo.save(
    tokenRepo.create({ userId: user.id, token: secret, label: '기존 커넥터 (마이그레이션)' }),
  );
  console.log('시딩 완료:', row.id, row.token);

  await app.close();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
