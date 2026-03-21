import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginRequestDto, LoginResponseDto } from '@modules/admin/auth/dto';
import { UserResponseDto } from '@modules/admin/users/dto/response/user-response.dto';
import { SuccessResponseDto } from '@common/dto/response/success-response.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Public } from '@common/decorators/public.decorator';
import { IJwtPayload } from '@common/interfaces';

@ApiTags('관리자 > 인증')
@Controller('admin/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Public()
  @ApiOperation({ summary: '로그인' })
  @ApiResponse({ status: 200, description: '로그인 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async login(
    @Body() dto: LoginRequestDto,
  ): Promise<SuccessResponseDto<LoginResponseDto>> {
    const result = await this.authService.login(dto);
    return new SuccessResponseDto('로그인에 성공했습니다.', result);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '현재 사용자 정보 조회' })
  @ApiResponse({ status: 200, description: '조회 성공' })
  @ApiResponse({ status: 401, description: '인증되지 않음' })
  async getCurrentUser(
    @CurrentUser() user: IJwtPayload,
  ): Promise<SuccessResponseDto<UserResponseDto>> {
    const currentUser = await this.authService.getCurrentUser(user.sub);
    return new SuccessResponseDto('사용자 정보를 조회했습니다.', currentUser);
  }
}
