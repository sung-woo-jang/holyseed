import { Body, Controller, Post, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '@common/decorators/public.decorator';
import { WeddingAuthService } from './auth.service';
import { WeddingRegisterDto } from './dto/request/register.dto';
import { WeddingLoginDto } from './dto/request/login.dto';

@ApiTags('Wedding 인증')
@Controller('wedding/auth')
export class WeddingAuthController {
  constructor(private readonly authService: WeddingAuthService) {}

  @Post('register')
  @Public()
  @ApiOperation({ summary: '커플+관리자 계정 등록' })
  @ApiResponse({ status: 201, description: '등록 성공 및 JWT 발급' })
  @ApiResponse({ status: 409, description: '이메일 또는 slug 중복' })
  async register(@Body() dto: WeddingRegisterDto) {
    const data = await this.authService.register(dto);
    return {
      success: true,
      message: '커플 계정이 생성되었습니다.',
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('login')
  @Public()
  @ApiOperation({ summary: '로그인' })
  @ApiResponse({ status: 200, description: 'JWT 발급' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async login(@Body() dto: WeddingLoginDto) {
    const data = await this.authService.login(dto);
    return {
      success: true,
      message: '로그인 성공',
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: '현재 사용자 정보 조회' })
  @ApiResponse({ status: 200, description: '사용자+커플 정보' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  async getMe(@Request() req: any) {
    const data = await this.authService.getMe(req.user.userId);
    return {
      success: true,
      message: '사용자 정보 조회 성공',
      data,
      timestamp: new Date().toISOString(),
    };
  }
}
