import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AssetsService } from './assets.service';
import { MembershipGuard } from '../../common/guards/membership.guard';
import { RequireMembership } from '../../common/decorators/require-membership.decorator';
import { MemberRole } from '../memberships/entities/membership.entity';
import { CreateAssetDto } from './dto/request/create-asset.dto';
import { SearchAssetsDto } from './dto/request/search-assets.dto';

@ApiTags('AD 자산')
@Controller('ad')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Get('households/:householdId/assets')
  @UseGuards(MembershipGuard)
  @ApiOperation({ summary: '자산 목록 조회' })
  async findAll(@Param('householdId', ParseIntPipe) householdId: number) {
    const data = await this.assetsService.findByHousehold(householdId);
    return { success: true, message: '조회 성공', data, timestamp: new Date().toISOString() };
  }

  @Post('households/:householdId/assets/search')
  @UseGuards(MembershipGuard)
  @ApiOperation({ summary: '자산 검색' })
  async search(@Param('householdId', ParseIntPipe) householdId: number, @Body() dto: SearchAssetsDto) {
    const data = await this.assetsService.search(householdId, dto);
    return { success: true, message: '조회 성공', data, timestamp: new Date().toISOString() };
  }

  @Post('households/:householdId/assets')
  @UseGuards(MembershipGuard)
  @RequireMembership({ minRole: MemberRole.EDITOR })
  @ApiOperation({ summary: '자산 생성' })
  async create(@Param('householdId', ParseIntPipe) householdId: number, @Body() dto: CreateAssetDto) {
    const data = await this.assetsService.create(householdId, dto);
    return { success: true, message: '자산 생성 성공', data, timestamp: new Date().toISOString() };
  }

  @Get('assets/:id')
  @ApiOperation({ summary: '자산 상세 조회' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const data = await this.assetsService.findOne(id);
    return { success: true, message: '조회 성공', data, timestamp: new Date().toISOString() };
  }

  @Post('assets/:id/update')
  @ApiOperation({ summary: '자산 수정' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: Partial<CreateAssetDto>) {
    const data = await this.assetsService.update(id, dto);
    return { success: true, message: '수정 성공', data, timestamp: new Date().toISOString() };
  }

  @Post('assets/:id/archive')
  @ApiOperation({ summary: '자산 아카이브' })
  async archive(@Param('id', ParseIntPipe) id: number) {
    const data = await this.assetsService.archive(id);
    return { success: true, message: '아카이브 성공', data, timestamp: new Date().toISOString() };
  }

  @Post('assets/:id/delete')
  @ApiOperation({ summary: '자산 삭제' })
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.assetsService.delete(id);
    return { success: true, message: '삭제 성공', data: null, timestamp: new Date().toISOString() };
  }
}
