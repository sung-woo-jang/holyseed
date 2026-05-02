import { Controller, Get, Post, Body, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '@common/decorators/public.decorator';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/request/create-category.dto';
import { UpdateCategoryDto } from './dto/request/update-category.dto';
import { AssignMappingsDto } from './dto/request/assign-mappings.dto';

@ApiTags('통합 카테고리')
@Controller('zc/categories')
@Public()
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: '통합 카테고리 전체 조회' })
  async findAll() {
    const data = await this.categoriesService.findAll();
    return { success: true, message: '카테고리 목록 조회 성공', data };
  }

  @Get('tree')
  @ApiOperation({ summary: '통합 카테고리 트리 조회 (사이트 카테고리 매핑 수 포함)' })
  async findTree() {
    const data = await this.categoriesService.findTree();
    return { success: true, message: '카테고리 트리 조회 성공', data };
  }

  @Get(':id')
  @ApiOperation({ summary: '통합 카테고리 단건 조회' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.categoriesService.findOne(id);
    return { success: true, message: '카테고리 조회 성공', data };
  }

  @Get(':id/mappings')
  @ApiOperation({ summary: '통합 카테고리에 매핑된 사이트 카테고리 목록' })
  async findMappings(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.categoriesService.findMappings(id);
    return { success: true, message: '매핑 목록 조회 성공', data };
  }

  @Post()
  @ApiOperation({ summary: '통합 카테고리 생성' })
  @ApiResponse({ status: 201, description: '생성 성공' })
  async create(@Body() dto: CreateCategoryDto) {
    const data = await this.categoriesService.create(dto);
    return { success: true, message: '카테고리 생성 성공', data };
  }

  @Post(':id/update')
  @ApiOperation({ summary: '통합 카테고리 수정' })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCategoryDto) {
    const data = await this.categoriesService.update(id, dto);
    return { success: true, message: '카테고리 수정 성공', data };
  }

  @Post(':id/delete')
  @ApiOperation({ summary: '통합 카테고리 삭제 (하위 카테고리 없을 때만)' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.categoriesService.remove(id);
    return { success: true, message: '카테고리 삭제 성공', data: null };
  }

  @Post(':id/mappings')
  @ApiOperation({ summary: '사이트 카테고리를 통합 카테고리에 매핑' })
  async assignMappings(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignMappingsDto,
  ) {
    await this.categoriesService.assignMappings(id, dto);
    return { success: true, message: '매핑 완료', data: null };
  }

  @Post(':id/mappings/remove')
  @ApiOperation({ summary: '사이트 카테고리 매핑 해제' })
  async removeMappings(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignMappingsDto,
  ) {
    await this.categoriesService.removeMappings(id, dto);
    return { success: true, message: '매핑 해제 완료', data: null };
  }
}
