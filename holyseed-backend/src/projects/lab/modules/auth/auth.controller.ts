import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '@common/decorators';
import { AuthService } from './auth.service';
import { RefreshTokenDto } from './dto/request/refresh-token.dto';
import { RegisterDto } from './dto/request/register.dto';
import { LoginDto } from './dto/request/login.dto';

@ApiTags('Lab 인증')
@Controller('lab/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Public()
  @ApiOperation({ summary: '이메일 회원가입' })
  async register(@Body() dto: RegisterDto) {
    const result = await this.authService.register(dto);
    return { success: true, message: '회원가입 성공', data: result, timestamp: new Date().toISOString() };
  }

  @Post('login')
  @Public()
  @ApiOperation({ summary: '이메일 로그인' })
  async login(@Body() dto: LoginDto) {
    const result = await this.authService.emailLogin(dto);
    return { success: true, message: '로그인 성공', data: result, timestamp: new Date().toISOString() };
  }

  @Post('refresh')
  @Public()
  @ApiOperation({ summary: '토큰 갱신' })
  async refresh(@Body() dto: RefreshTokenDto) {
    const result = await this.authService.refresh(dto.refreshToken);
    return { success: true, message: '토큰 갱신 성공', data: result, timestamp: new Date().toISOString() };
  }
}
