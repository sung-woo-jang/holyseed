import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '@common/decorators';
import { JipAuthService } from './jip-auth.service';
import { JipLoginDto } from './dto/request/login.dto';

@ApiTags('JIP 인증')
@Controller('jip/auth')
export class JipAuthController {
  constructor(private readonly jipAuthService: JipAuthService) {}

  @Post('login')
  @Public()
  @ApiOperation({ summary: '집수리 관리자 로그인' })
  async login(@Body() dto: JipLoginDto) {
    const data = await this.jipAuthService.login(dto);
    return { success: true, message: '로그인 성공', data, timestamp: new Date().toISOString() };
  }
}
