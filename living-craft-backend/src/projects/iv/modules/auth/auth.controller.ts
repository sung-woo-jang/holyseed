import { Body, Controller, Get, Post } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { IsString, MinLength, MaxLength } from 'class-validator'
import { Public, CurrentUser } from '@common/decorators'
import { IvAuthService } from './auth.service'

class RegisterDto {
  @IsString() @MinLength(3) @MaxLength(50) username: string
  @IsString() @MinLength(6) password: string
}

class LoginDto {
  @IsString() username: string
  @IsString() password: string
}

class NicknameDto {
  @IsString() @MaxLength(50) nickname: string
}

const ok = (data: unknown, message = '성공') => ({
  success: true, message, data, timestamp: new Date().toISOString(),
})

@ApiTags('IV 인증')
@Controller('iv/auth')
export class IvAuthController {
  constructor(private readonly svc: IvAuthService) {}

  @Post('register')
  @Public()
  @ApiOperation({ summary: '회원가입' })
  async register(@Body() dto: RegisterDto) {
    return ok(await this.svc.register(dto.username, dto.password), '회원가입이 완료되었습니다.')
  }

  @Post('login')
  @Public()
  @ApiOperation({ summary: '로그인' })
  async login(@Body() dto: LoginDto) {
    return ok(await this.svc.login(dto.username, dto.password), '로그인되었습니다.')
  }

  @Get('me')
  @ApiOperation({ summary: '내 정보' })
  async me(@CurrentUser() user: { userId: string }) {
    return ok(await this.svc.me(user.userId))
  }

  @Post('nickname')
  @ApiOperation({ summary: '별명 설정' })
  async setNickname(@CurrentUser() user: { userId: string }, @Body() dto: NicknameDto) {
    return ok(await this.svc.updateNickname(user.userId, dto.nickname), '별명이 설정되었습니다.')
  }
}
