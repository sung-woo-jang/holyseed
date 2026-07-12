import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { MembershipGuard } from '../../common/guards/membership.guard';
import { RequireMembership } from '../../common/decorators/require-membership.decorator';
import { MemberRole } from '../memberships/entities/membership.entity';
import { CreateCategoryDto } from './dto/request/create-category.dto';

@ApiTags('AD 카테고리')
@Controller('ad')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get('households/:householdId/categories')
  @UseGuards(MembershipGuard)
  @ApiOperation({ summary: '카테고리 목록 조회 (빌트인+커스텀)' })
  async findAll(@Param('householdId', ParseIntPipe) householdId: number) {
    const data = await this.categoriesService.findByHousehold(householdId);
    return { success: true, message: '조회 성공', data, timestamp: new Date().toISOString() };
  }

  @Post('households/:householdId/categories')
  @UseGuards(MembershipGuard)
  @RequireMembership({ minRole: MemberRole.EDITOR })
  @ApiOperation({ summary: '커스텀 카테고리 생성' })
  async create(@Param('householdId', ParseIntPipe) householdId: number, @Body() dto: CreateCategoryDto) {
    const data = await this.categoriesService.create(householdId, dto);
    return { success: true, message: '카테고리 생성 성공', data, timestamp: new Date().toISOString() };
  }

  @Post('categories/:id/update')
  @ApiOperation({ summary: '카테고리 수정' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: Partial<CreateCategoryDto>) {
    const data = await this.categoriesService.update(id, dto);
    return { success: true, message: '수정 성공', data, timestamp: new Date().toISOString() };
  }

  @Post('categories/:id/delete')
  @ApiOperation({ summary: '카테고리 삭제' })
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.categoriesService.delete(id);
    return { success: true, message: '삭제 성공', data: null, timestamp: new Date().toISOString() };
  }
}
