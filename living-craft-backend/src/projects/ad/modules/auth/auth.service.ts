import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as https from 'https';
import * as fs from 'fs';
import axios from 'axios';
import { AdUser } from '../users/entities/ad-user.entity';
import { AppLoginDto } from './dto/request/app-login.dto';

@Injectable()
export class AuthService {
  private readonly apiHost: string;
  private readonly sandboxHost: string;
  private readonly clientId: string;
  private readonly clientSecret: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    @InjectRepository(AdUser)
    private readonly userRepo: Repository<AdUser>,
  ) {
    this.apiHost = configService.get('AIT_AD_API_HOST') || 'https://apps-in-toss-api.toss.im';
    this.sandboxHost = configService.get('AIT_AD_SANDBOX_HOST') || 'https://sandbox.apps-in-toss-api.toss.im';
    this.clientId = configService.get('AIT_AD_CLIENT_ID') || '';
    this.clientSecret = configService.get('AIT_AD_CLIENT_SECRET') || '';
  }

  async appLogin(dto: AppLoginDto) {
    const host = dto.referrer === 'SANDBOX' ? this.sandboxHost : this.apiHost;
    const userKey = await this.exchangeToken(dto.authorizationCode, host);

    const user = await this.upsertUser(userKey);
    const tokens = this.issueTokens(user);

    return { ...tokens, user };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('jwt.secret'),
      });

      const user = await this.userRepo.findOne({ where: { id: payload.sub } });
      if (!user) throw new UnauthorizedException('사용자를 찾을 수 없습니다.');

      return this.issueTokens(user);
    } catch {
      throw new UnauthorizedException('갱신 토큰이 유효하지 않습니다.');
    }
  }

  private async exchangeToken(authorizationCode: string, host: string): Promise<string> {
    const certPath = this.configService.get('AIT_AD_CERT_PATH');
    const keyPath = this.configService.get('AIT_AD_KEY_PATH');

    const httpsAgent =
      certPath && keyPath && fs.existsSync(certPath) && fs.existsSync(keyPath)
        ? new https.Agent({ cert: fs.readFileSync(certPath), key: fs.readFileSync(keyPath) })
        : undefined;

    try {
      const response = await axios.post(
        `${host}/api-partner/v1/apps-in-toss/user/oauth2`,
        { authorizationCode, clientId: this.clientId, clientSecret: this.clientSecret },
        { httpsAgent, timeout: 10000 },
      );
      return String(response.data.userKey);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development' && !this.clientId) {
        // 개발 환경에서 mTLS 미설정 시 authorizationCode를 userKey로 사용 (더미)
        return authorizationCode || 'dev-user-999999';
      }
      throw new UnauthorizedException('토스 토큰 교환에 실패했습니다.');
    }
  }

  private async upsertUser(tossUserKey: string): Promise<AdUser> {
    let user = await this.userRepo.findOne({ where: { tossUserKey } });

    if (!user) {
      user = this.userRepo.create({
        tossUserKey,
        name: `사용자${tossUserKey.slice(-4)}`,
        avatarColor: this.randomColor(),
        initial: '사',
      });
    }

    user.lastLoginAt = new Date();
    return this.userRepo.save(user);
  }

  private issueTokens(user: AdUser) {
    const payload = { sub: user.id, tossUserKey: user.tossUserKey };
    const secret = this.configService.get('jwt.secret');

    return {
      accessToken: this.jwtService.sign(payload, { secret, expiresIn: '24h' }),
      refreshToken: this.jwtService.sign(payload, { secret, expiresIn: '30d' }),
    };
  }

  private randomColor(): string {
    const colors = ['#3182F6', '#FF6D35', '#34C759', '#FF3B30', '#AF52DE', '#FF9500'];
    return colors[Math.floor(Math.random() * colors.length)];
  }
}
