import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '@common/decorators';
import { AuthService } from './auth.service';
import { AppLoginDto } from './dto/request/app-login.dto';
import { RefreshTokenDto } from './dto/request/refresh-token.dto';

@ApiTags('AD 인증')
@Controller('ad/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('app-login')
  @Public()
  @ApiOperation({ summary: '토스 appLogin 연동 로그인' })
  async appLogin(@Body() dto: AppLoginDto) {
    const result = await this.authService.appLogin(dto);
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
