import { Controller, Get, Request } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';

@ApiTags('Lab 사용자')
@Controller('lab/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: '내 프로필 조회' })
  async getMe(@Request() req: any) {
    const user = await this.usersService.findById(req.user.userId);
    return { success: true, message: '조회 성공', data: user, timestamp: new Date().toISOString() };
  }
}
