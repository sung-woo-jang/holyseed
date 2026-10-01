import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { FridgeUser } from '../entities';

interface GoogleProfile {
  googleId: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
}

@Injectable()
export class FridgeAuthService {
  private readonly logger = new Logger(FridgeAuthService.name);
  private readonly googleClientId: string;
  private readonly googleClientSecret: string;
  private readonly oauthCallbackBase: string;
  readonly frontUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    @InjectRepository(FridgeUser) private readonly userRepo: Repository<FridgeUser>,
  ) {
    this.googleClientId = configService.get('FRIDGE_GOOGLE_CLIENT_ID') || '';
    this.googleClientSecret = configService.get('FRIDGE_GOOGLE_CLIENT_SECRET') || '';
    this.oauthCallbackBase = configService.get('FRIDGE_OAUTH_CALLBACK_BASE') || 'http://localhost:4000/api/fridge';
    this.frontUrl = configService.get('FRIDGE_FRONT_URL') || 'http://localhost:4000';
  }

  private get redirectUri(): string {
    return `${this.oauthCallbackBase}/auth/google/callback`;
  }

  private get secret(): string {
    return this.configService.get<string>('jwt.secret');
  }

  /** CSRF 방지용 state — 10분짜리 서명 JWT */
  authorizeUrl(): string {
    if (!this.googleClientId) throw new UnauthorizedException('Google OAuth가 설정되지 않았습니다.');
    const state = this.jwtService.sign({ purpose: 'fridge-oauth-state' }, { secret: this.secret, expiresIn: '10m' });
    const q = new URLSearchParams({
      client_id: this.googleClientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      state,
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${q.toString()}`;
  }

  private verifyState(state: string): void {
    try {
      const payload = this.jwtService.verify(state, { secret: this.secret });
      if (payload.purpose !== 'fridge-oauth-state') throw new Error('mismatch');
    } catch (err) {
      this.logger.warn(`OAuth state 검증 실패: ${err instanceof Error ? err.message : err}`);
      throw new UnauthorizedException('유효하지 않은 OAuth state입니다.');
    }
  }

  async googleLogin(code: string, state: string) {
    this.verifyState(state);
    const profile = await this.fetchGoogleProfile(code);
    const user = await this.upsertUser(profile);
    return this.issueTokens(user);
  }

  private async fetchGoogleProfile(code: string): Promise<GoogleProfile> {
    try {
      const { data: token } = await axios.post(
        'https://oauth2.googleapis.com/token',
        new URLSearchParams({
          code,
          client_id: this.googleClientId,
          client_secret: this.googleClientSecret,
          redirect_uri: this.redirectUri,
          grant_type: 'authorization_code',
        }).toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 10000 },
      );
      const { data: profile } = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${token.access_token}` },
        timeout: 10000,
      });
      return {
        googleId: String(profile.id),
        email: profile.email?.toLowerCase() ?? null,
        name: profile.name ?? null,
        avatarUrl: profile.picture ?? null,
      };
    } catch (err) {
      const detail = axios.isAxiosError(err) ? JSON.stringify(err.response?.data ?? err.message) : String(err);
      this.logger.error(`Google 프로필 조회 실패: ${detail}`);
      throw new UnauthorizedException('Google 로그인에 실패했습니다.');
    }
  }

  private async upsertUser(profile: GoogleProfile): Promise<FridgeUser> {
    let user = await this.userRepo.findOne({ where: { googleId: profile.googleId } });
    if (!user) {
      const name = profile.name || profile.email?.split('@')[0] || `사용자${profile.googleId.slice(-4)}`;
      user = this.userRepo.create({ googleId: profile.googleId, name });
    }
    user.email = profile.email;
    user.avatarUrl = profile.avatarUrl;
    user.lastLoginAt = new Date();
    return this.userRepo.save(user);
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, { secret: this.secret });
      if (payload.aud !== 'fridge') throw new Error('aud mismatch');
      const user = await this.userRepo.findOne({ where: { id: Number(payload.sub) } });
      if (!user) throw new Error('user not found');
      return this.issueTokens(user);
    } catch {
      throw new UnauthorizedException('갱신 토큰이 유효하지 않습니다.');
    }
  }

  private issueTokens(user: FridgeUser) {
    const payload = { sub: String(user.id), email: user.email, aud: 'fridge' };
    return {
      accessToken: this.jwtService.sign(payload, { secret: this.secret, expiresIn: '24h' }),
      refreshToken: this.jwtService.sign(payload, { secret: this.secret, expiresIn: '30d' }),
    };
  }
}
