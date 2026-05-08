import { Body, Controller, Get, Post, Request } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/request/update-user.dto';

@ApiTags('AD 사용자')
@Controller('ad/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: '내 프로필 조회' })
  async getMe(@Request() req: any) {
    const user = await this.usersService.findById(req.user.userId);
    return { success: true, message: '조회 성공', data: user, timestamp: new Date().toISOString() };
  }

  @Post('me/update')
  @ApiOperation({ summary: '내 프로필 수정' })
  async updateMe(@Request() req: any, @Body() dto: UpdateUserDto) {
    const user = await this.usersService.update(req.user.userId, dto);
    return { success: true, message: '수정 성공', data: user, timestamp: new Date().toISOString() };
  }
}
