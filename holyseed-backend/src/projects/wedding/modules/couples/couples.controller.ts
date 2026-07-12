import { Body, Controller, Get, Param, Post, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '@common/decorators/public.decorator';
import { CouplesService } from './couples.service';
import { UpdateCoupleDto } from './dto/request/update-couple.dto';
import { CoupleBySlugDto } from './dto/request/by-slug.dto';

@ApiTags('Wedding 커플')
@ApiBearerAuth()
@Controller('wedding/couples')
export class CouplesController {
  constructor(private readonly couplesService: CouplesService) {}

  @Get()
  @ApiOperation({ summary: '커플 목록 (본인 또는 전체)' })
  async findAll(@Request() req: any) {
    const data = await this.couplesService.findAll(req.user);
    return {
      success: true,
      message: '커플 목록 조회 성공',
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('by-slug')
  @Public()
  @ApiOperation({ summary: '청첩장 slug로 커플 정보 조회 (공개)' })
  @ApiResponse({ status: 200, description: '커플 정보' })
  @ApiResponse({ status: 404, description: '청첩장 없음' })
  async findBySlug(@Body() dto: CoupleBySlugDto) {
    const data = await this.couplesService.findBySlug(dto.slug);
    return {
      success: true,
      message: '청첩장 정보 조회 성공',
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: '커플 상세 조회' })
  @ApiResponse({ status: 404, description: '없음' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  async findById(@Param('id') id: string, @Request() req: any) {
    const data = await this.couplesService.findById(id, req.user);
    return {
      success: true,
      message: '커플 정보 조회 성공',
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Post(':id/update')
  @ApiOperation({ summary: '커플 정보 수정' })
  @ApiResponse({ status: 404, description: '없음' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  async update(@Param('id') id: string, @Body() dto: UpdateCoupleDto, @Request() req: any) {
    const data = await this.couplesService.update(id, dto, req.user);
    return {
      success: true,
      message: '커플 정보가 수정되었습니다.',
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Post(':id/delete')
  @ApiOperation({ summary: '커플 삭제 (SUPER_ADMIN)' })
  @ApiResponse({ status: 403, description: 'SUPER_ADMIN 전용' })
  async delete(@Param('id') id: string, @Request() req: any) {
    await this.couplesService.delete(id, req.user);
    return {
      success: true,
      message: '커플이 삭제되었습니다.',
      data: null,
      timestamp: new Date().toISOString(),
    };
  }
}
