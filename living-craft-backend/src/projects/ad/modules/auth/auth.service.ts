import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import * as bcrypt from 'bcrypt';
import { AdUser } from '../users/entities/ad-user.entity';
import { RegisterDto } from './dto/request/register.dto';
import { LoginDto } from './dto/request/login.dto';

export type OAuthProvider = 'google' | 'naver';

interface OAuthProfile {
  providerId: string;
  email: string | null;
  name: string | null;
}

@Injectable()
export class AuthService {
  private readonly googleClientId: string;
  private readonly googleClientSecret: string;
  private readonly naverClientId: string;
  private readonly naverClientSecret: string;
  /** OAuth redirect_uri 베이스 — 기본은 프론트 dev 프록시 경유 */
  private readonly oauthCallbackBase: string;
  readonly frontUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    @InjectRepository(AdUser)
    private readonly userRepo: Repository<AdUser>,
  ) {
    this.googleClientId = configService.get('AD_GOOGLE_CLIENT_ID') || '';
    this.googleClientSecret = configService.get('AD_GOOGLE_CLIENT_SECRET') || '';
    this.naverClientId = configService.get('AD_NAVER_CLIENT_ID') || '';
    this.naverClientSecret = configService.get('AD_NAVER_CLIENT_SECRET') || '';
    this.oauthCallbackBase = configService.get('AD_OAUTH_CALLBACK_BASE') || 'http://localhost:3400/api/ad';
    this.frontUrl = configService.get('AD_FRONT_URL') || 'http://localhost:3400';
  }

  // ─── 소셜 로그인 (Google / Naver) ─────────────────────────────────────────────

  private redirectUri(provider: OAuthProvider): string {
    return `${this.oauthCallbackBase}/auth/${provider}/callback`;
  }

  /** CSRF 방지용 state — 10분짜리 서명 JWT */
  private issueState(provider: OAuthProvider): string {
    return this.jwtService.sign(
      { p: provider, purpose: 'oauth-state' },
      { secret: this.configService.get('jwt.secret'), expiresIn: '10m' },
    );
  }

  private verifyState(state: string, provider: OAuthProvider): void {
    try {
      const payload = this.jwtService.verify(state, { secret: this.configService.get('jwt.secret') });
      if (payload.purpose !== 'oauth-state' || payload.p !== provider) throw new Error('mismatch');
    } catch {
      throw new UnauthorizedException('유효하지 않은 OAuth state입니다.');
    }
  }

  authorizeUrl(provider: OAuthProvider): string {
    const state = this.issueState(provider);
    if (provider === 'google') {
      if (!this.googleClientId) throw new UnauthorizedException('Google OAuth가 설정되지 않았습니다.');
      const q = new URLSearchParams({
        client_id: this.googleClientId,
        redirect_uri: this.redirectUri('google'),
        response_type: 'code',
        scope: 'openid email profile',
        state,
      });
      return `https://accounts.google.com/o/oauth2/v2/auth?${q.toString()}`;
    }
    if (!this.naverClientId) throw new UnauthorizedException('Naver OAuth가 설정되지 않았습니다.');
    const q = new URLSearchParams({
      client_id: this.naverClientId,
      redirect_uri: this.redirectUri('naver'),
      response_type: 'code',
      state,
    });
    return `https://nid.naver.com/oauth2.0/authorize?${q.toString()}`;
  }

  async oauthLogin(provider: OAuthProvider, code: string, state: string) {
    this.verifyState(state, provider);
    const profile =
      provider === 'google'
        ? await this.fetchGoogleProfile(code)
        : await this.fetchNaverProfile(code, state);

    const user = await this.upsertOAuthUser(provider, profile);
    return { ...this.issueTokens(user), user };
  }

  private async fetchGoogleProfile(code: string): Promise<OAuthProfile> {
    try {
      const { data: token } = await axios.post(
        'https://oauth2.googleapis.com/token',
        new URLSearchParams({
          code,
          client_id: this.googleClientId,
          client_secret: this.googleClientSecret,
          redirect_uri: this.redirectUri('google'),
          grant_type: 'authorization_code',
        }).toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 10000 },
      );
      const { data: profile } = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${token.access_token}` },
        timeout: 10000,
      });
      return {
        providerId: String(profile.id),
        email: profile.email?.toLowerCase() ?? null,
        name: profile.name ?? null,
      };
    } catch {
      throw new UnauthorizedException('Google 로그인에 실패했습니다.');
    }
  }

  private async fetchNaverProfile(code: string, state: string): Promise<OAuthProfile> {
    try {
      const { data: token } = await axios.get('https://nid.naver.com/oauth2.0/token', {
        params: {
          grant_type: 'authorization_code',
          client_id: this.naverClientId,
          client_secret: this.naverClientSecret,
          code,
          state,
        },
        timeout: 10000,
      });
      const { data: me } = await axios.get('https://openapi.naver.com/v1/nid/me', {
        headers: { Authorization: `Bearer ${token.access_token}` },
        timeout: 10000,
      });
      const profile = me.response;
      return {
        providerId: String(profile.id),
        email: profile.email?.toLowerCase() ?? null,
        name: profile.name ?? profile.nickname ?? null,
      };
    } catch {
      throw new UnauthorizedException('네이버 로그인에 실패했습니다.');
    }
  }

  /** providerId 우선 매칭, 없으면 동일 이메일 계정에 연동, 그마저 없으면 신규 생성 */
  private async upsertOAuthUser(provider: OAuthProvider, profile: OAuthProfile): Promise<AdUser> {
    const idColumn = provider === 'google' ? 'googleId' : 'naverId';

    let user = await this.userRepo.findOne({ where: { [idColumn]: profile.providerId } });

    if (!user && profile.email) {
      user = await this.userRepo.findOne({ where: { email: profile.email } });
      if (user) user[idColumn] = profile.providerId;
    }

    if (!user) {
      const name = profile.name || (profile.email ? profile.email.split('@')[0] : `사용자${profile.providerId.slice(-4)}`);
      user = this.userRepo.create({
        [idColumn]: profile.providerId,
        email: profile.email,
        name,
        initial: name.charAt(0),
        avatarColor: this.randomColor(),
      });
    }

    user.lastLoginAt = new Date();
    return this.userRepo.save(user);
  }

  async register(dto: RegisterDto) {
    const existing = await this.userRepo.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('이미 사용 중인 이메일입니다.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const name = dto.name || dto.email.split('@')[0];

    const user = this.userRepo.create({
      email: dto.email,
      passwordHash,
      name,
      initial: name.charAt(0),
      avatarColor: this.randomColor(),
      lastLoginAt: new Date(),
    });
    const saved = await this.userRepo.save(user);
    delete saved.passwordHash;

    return { ...this.issueTokens(saved), user: saved };
  }

  async emailLogin(dto: LoginDto) {
    const user = await this.userRepo
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email: dto.email })
      .getOne();

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    const isValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    user.lastLoginAt = new Date();
    await this.userRepo.save(user);
    delete user.passwordHash;

    return { ...this.issueTokens(user), user };
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

  private issueTokens(user: AdUser) {
    const payload = { sub: user.id, tossUserKey: user.tossUserKey, email: user.email };
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
