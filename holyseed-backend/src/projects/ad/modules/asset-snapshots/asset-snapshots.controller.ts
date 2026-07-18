import { Body, Controller, Get, Param, ParseIntPipe, Post, Request, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AssetSnapshotsService } from './asset-snapshots.service';
import { MembershipGuard } from '../../common/guards/membership.guard';
import { RequireMembership } from '../../common/decorators/require-membership.decorator';
import { MemberRole } from '../memberships/entities/membership.entity';
import { UpsertSnapshotDto } from './dto/request/upsert-snapshot.dto';
import { BatchUpsertSnapshotsDto } from './dto/request/batch-upsert-snapshots.dto';
import { DeleteSnapshotDto } from './dto/request/delete-snapshot.dto';

@ApiTags('AD 스냅샷')
@Controller('ad')
export class AssetSnapshotsController {
  constructor(private readonly snapshotsService: AssetSnapshotsService) {}

  @Get('assets/:assetId/snapshots')
  @ApiOperation({ summary: '자산 스냅샷 목록 조회' })
  async findByAsset(@Param('assetId', ParseIntPipe) assetId: number) {
    const data = await this.snapshotsService.findByAsset(assetId);
    return { success: true, message: '조회 성공', data, timestamp: new Date().toISOString() };
  }

  @Post('assets/:assetId/snapshots')
  @UseGuards(MembershipGuard)
  @RequireMembership({ minRole: MemberRole.EDITOR })
  @ApiOperation({ summary: '자산 스냅샷 단건 upsert' })
  async upsert(@Param('assetId', ParseIntPipe) assetId: number, @Body() dto: UpsertSnapshotDto, @Request() req: any) {
    const data = await this.snapshotsService.upsert(assetId, dto, req.user?.userId);
    return { success: true, message: '스냅샷 저장 성공', data, timestamp: new Date().toISOString() };
  }

  @Post('households/:householdId/snapshots/batch')
  @UseGuards(MembershipGuard)
  @RequireMembership({ minRole: MemberRole.EDITOR })
  @ApiOperation({ summary: '자산 스냅샷 일괄 upsert' })
  async batchUpsert(
    @Param('householdId', ParseIntPipe) householdId: number,
    @Body() dto: BatchUpsertSnapshotsDto,
    @Request() req: any,
  ) {
    const data = await this.snapshotsService.batchUpsert(householdId, dto, req.user?.userId);
    return { success: true, message: '일괄 스냅샷 저장 성공', data, timestamp: new Date().toISOString() };
  }

  @Post('assets/:assetId/snapshots/delete')
  @UseGuards(MembershipGuard)
  @RequireMembership({ minRole: MemberRole.EDITOR })
  @ApiOperation({ summary: '자산 스냅샷 삭제' })
  async delete(@Param('assetId', ParseIntPipe) assetId: number, @Body() dto: DeleteSnapshotDto) {
    await this.snapshotsService.delete(assetId, dto);
    return { success: true, message: '스냅샷 삭제 성공', data: null, timestamp: new Date().toISOString() };
  }
}
