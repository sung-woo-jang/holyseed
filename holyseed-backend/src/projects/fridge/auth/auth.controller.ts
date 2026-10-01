import { Body, Controller, Get, Logger, Post, Query, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { IsString } from 'class-validator';
import type { Response } from 'express';
import { Public } from '@common/decorators';
import { ok } from '../common/ok';
import { FridgeAuthService } from './auth.service';

class RefreshDto {
  @IsString()
  refreshToken: string;
}

@ApiTags('Fridge 인증')
@Controller('fridge/auth')
export class FridgeAuthController {
  private readonly logger = new Logger(FridgeAuthController.name);

  constructor(private readonly authService: FridgeAuthService) {}

  @Get('google')
  @Public()
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: '구글 로그인 시작 (인증 페이지로 리다이렉트)' })
  googleStart(@Res() res: Response) {
    res.redirect(this.authService.authorizeUrl());
  }

  @Get('google/callback')
  @Public()
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: '구글 로그인 콜백 — JWT 발급 후 프론트로 리다이렉트' })
  async googleCallback(@Query('code') code: string, @Query('state') state: string, @Res() res: Response) {
    const front = this.authService.frontUrl;
    if (!code) return res.redirect(`${front}/login?error=oauth`);
    try {
      const { accessToken, refreshToken } = await this.authService.googleLogin(code, state ?? '');
      // 토큰은 fragment로 전달 — 서버 로그/리퍼러에 남지 않음
      return res.redirect(`${front}/auth/callback#accessToken=${accessToken}&refreshToken=${refreshToken}`);
    } catch (err) {
      this.logger.error(`OAuth 콜백 처리 실패: ${err instanceof Error ? err.message : err}`);
      return res.redirect(`${front}/login?error=oauth`);
    }
  }

  @Post('refresh')
  @Public()
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: '토큰 갱신' })
  async refresh(@Body() dto: RefreshDto) {
    return ok('토큰 갱신 성공', await this.authService.refresh(dto.refreshToken));
  }
}
