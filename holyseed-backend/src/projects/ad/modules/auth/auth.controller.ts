import { Body, Controller, Get, Logger, Post, Query, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { Public } from '@common/decorators';
import { AuthService, type OAuthProvider } from './auth.service';
import { RefreshTokenDto } from './dto/request/refresh-token.dto';
import { RegisterDto } from './dto/request/register.dto';
import { isOwner } from '@common/utils/owner';

/** 앱이 모드(라오어·근무일지) 노출 여부를 정할 수 있게 로그인 응답의 user에 소유자 여부를 덧붙인다 */
function withOwnerFlag<T extends { user?: any }>(result: T): T {
  const u = result.user;
  return u ? { ...result, user: { ...u, isOwner: isOwner({ userId: u.id, email: u.email, aud: 'ad' }) } } : result;
}
import { LoginDto } from './dto/request/login.dto';

@ApiTags('AD 인증')
@Controller('ad/auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: '이메일 회원가입' })
  async register(@Body() dto: RegisterDto) {
    const result = withOwnerFlag(await this.authService.register(dto));
    return { success: true, message: '회원가입 성공', data: result, timestamp: new Date().toISOString() };
  }

  @Post('login')
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: '이메일 로그인' })
  async login(@Body() dto: LoginDto) {
    const result = withOwnerFlag(await this.authService.emailLogin(dto));
    return { success: true, message: '로그인 성공', data: result, timestamp: new Date().toISOString() };
  }

  @Post('refresh')
  @Public()
  @ApiOperation({ summary: '토큰 갱신' })
  async refresh(@Body() dto: RefreshTokenDto) {
    const result = await this.authService.refresh(dto.refreshToken);
    return { success: true, message: '토큰 갱신 성공', data: result, timestamp: new Date().toISOString() };
  }

  @Get('google')
  @Public()
  @ApiOperation({ summary: '구글 로그인 시작 (인증 페이지로 리다이렉트)' })
  googleStart(
    @Query('platform') platform: 'web' | 'app' | undefined,
    @Query('redirectUri') redirectUri: string | undefined,
    @Res() res: Response,
  ) {
    res.redirect(this.authService.authorizeUrl('google', platform === 'app' ? 'app' : 'web', redirectUri));
  }

  @Get('google/callback')
  @Public()
  @ApiOperation({ summary: '구글 로그인 콜백 — JWT 발급 후 프론트로 리다이렉트' })
  async googleCallback(@Query('code') code: string, @Query('state') state: string, @Res() res: Response) {
    return this.handleOAuthCallback('google', code, state, res);
  }

  private async handleOAuthCallback(provider: OAuthProvider, code: string, state: string, res: Response) {
    const front = this.authService.frontUrl;
    const { platform, appRedirectUri } = this.authService.decodeAppState(state ?? '');
    if (!code) {
      if (platform === 'app') return res.redirect(this.authService.appErrorCallbackUrl(appRedirectUri));
      return res.redirect(`${front}/login?error=oauth`);
    }
    try {
      const { accessToken, refreshToken } = await this.authService.oauthLogin(provider, code, state ?? '');
      if (platform === 'app') {
        return res.redirect(this.authService.appCallbackUrl(accessToken, refreshToken, appRedirectUri));
      }
      // 웹은 토큰을 fragment로 전달 — 서버 로그/리퍼러에 남지 않음
      return res.redirect(`${front}/auth/callback#accessToken=${accessToken}&refreshToken=${refreshToken}`);
    } catch (err) {
      this.logger.error(`OAuth 콜백 처리 실패 (${provider}): ${err instanceof Error ? err.message : err}`);
      if (platform === 'app') return res.redirect(this.authService.appErrorCallbackUrl(appRedirectUri));
      return res.redirect(`${front}/login?error=oauth`);
    }
  }
}
