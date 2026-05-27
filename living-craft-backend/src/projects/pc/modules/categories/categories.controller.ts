import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/request/create-category.dto';
import { UpdateCategoryDto } from './dto/request/update-category.dto';
import { ReorderCategoriesDto } from './dto/request/reorder-categories.dto';

@ApiTags('PC 카테고리')
@Controller('jip/pc/categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get('tree')
  @ApiOperation({ summary: '전체 카테고리 트리 조회' })
  async getTree() {
    const data = await this.categoriesService.findTree();
    return { success: true, message: '카테고리 트리 조회 성공', data, timestamp: new Date().toISOString() };
  }

  @Get()
  @ApiOperation({ summary: '전체 카테고리 평면 목록 조회' })
  async findAll() {
    const data = await this.categoriesService.findAll();
    return { success: true, message: '카테고리 목록 조회 성공', data, timestamp: new Date().toISOString() };
  }

  @Post()
  @ApiOperation({ summary: '카테고리 생성' })
  async create(@Body() dto: CreateCategoryDto) {
    const data = await this.categoriesService.create(dto);
    return { success: true, message: '카테고리 생성 성공', data, timestamp: new Date().toISOString() };
  }

  @Post('reorder')
  @ApiOperation({ summary: '카테고리 순서 변경' })
  async reorder(@Body() dto: ReorderCategoriesDto) {
    await this.categoriesService.reorder(dto.items);
    return { success: true, message: '카테고리 순서 변경 성공', data: null, timestamp: new Date().toISOString() };
  }

  @Post(':id/update')
  @ApiOperation({ summary: '카테고리 수정' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCategoryDto) {
    const data = await this.categoriesService.update(id, dto);
    return { success: true, message: '카테고리 수정 성공', data, timestamp: new Date().toISOString() };
  }

  @Post(':id/delete')
  @ApiOperation({ summary: '카테고리 삭제 (하위 없을 때만 가능)' })
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.categoriesService.delete(id);
    return { success: true, message: '카테고리 삭제 성공', data: null, timestamp: new Date().toISOString() };
  }
}
