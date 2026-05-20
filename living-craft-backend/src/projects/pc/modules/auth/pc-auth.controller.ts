import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '@common/decorators';
import { PcAuthService } from './pc-auth.service';
import { PcLoginDto } from './dto/request/login.dto';

@ApiTags('PC 인증')
@Controller('pc/auth')
export class PcAuthController {
  constructor(private readonly pcAuthService: PcAuthService) {}

  @Post('login')
  @Public()
  @ApiOperation({ summary: '단가표 관리 로그인' })
  async login(@Body() dto: PcLoginDto) {
    const data = await this.pcAuthService.login(dto);
    return { success: true, message: '로그인 성공', data, timestamp: new Date().toISOString() };
  }
}
