import { Body, Controller, Param, Post, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '@common/decorators/public.decorator';
import { GuestbookService } from './guestbook.service';
import { CreateGuestbookDto } from './dto/request/create-guestbook.dto';
import { SearchGuestbookDto } from './dto/request/search-guestbook.dto';

@ApiTags('Wedding 방명록')
@Controller('wedding/guestbook')
export class GuestbookController {
  constructor(private readonly guestbookService: GuestbookService) {}

  @Post()
  @Public()
  @ApiOperation({ summary: '방명록 작성 (하객 공개)' })
  @ApiResponse({ status: 201, description: '방명록 등록 성공' })
  async create(@Body() dto: CreateGuestbookDto) {
    const data = await this.guestbookService.create(dto);
    return {
      success: true,
      message: '방명록이 등록되었습니다.',
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('search')
  @Public()
  @ApiOperation({ summary: '방명록 목록 조회 (공개)' })
  async search(@Body() dto: SearchGuestbookDto) {
    const data = await this.guestbookService.search(dto);
    return {
      success: true,
      message: '방명록 목록 조회 성공',
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Post(':id/delete')
  @ApiBearerAuth()
  @ApiOperation({ summary: '방명록 삭제 (관리자)' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  async delete(@Param('id') id: string, @Request() req: any) {
    await this.guestbookService.delete(id, req.user);
    return {
      success: true,
      message: '방명록이 삭제되었습니다.',
      data: null,
      timestamp: new Date().toISOString(),
    };
  }
}
