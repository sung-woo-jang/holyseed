import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { VendorsService } from './vendors.service';
import { CreateVendorDto } from './dto/request/create-vendor.dto';
import { UpdateVendorDto } from './dto/request/update-vendor.dto';

@ApiTags('PC 업체')
@Controller('jip/pc/vendors')
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Get()
  @ApiOperation({ summary: '전체 업체 목록 조회' })
  async findAll() {
    const data = await this.vendorsService.findAll();
    return { success: true, message: '업체 목록 조회 성공', data, timestamp: new Date().toISOString() };
  }

  @Get(':id')
  @ApiOperation({ summary: '업체 상세 조회' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const data = await this.vendorsService.findOne(id);
    return { success: true, message: '업체 조회 성공', data, timestamp: new Date().toISOString() };
  }

  @Post()
  @ApiOperation({ summary: '업체 생성' })
  async create(@Body() dto: CreateVendorDto) {
    const data = await this.vendorsService.create(dto);
    return { success: true, message: '업체 생성 성공', data, timestamp: new Date().toISOString() };
  }

  @Post(':id/update')
  @ApiOperation({ summary: '업체 수정' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateVendorDto) {
    const data = await this.vendorsService.update(id, dto);
    return { success: true, message: '업체 수정 성공', data, timestamp: new Date().toISOString() };
  }

  @Post(':id/delete')
  @ApiOperation({ summary: '업체 삭제' })
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.vendorsService.delete(id);
    return { success: true, message: '업체 삭제 성공', data: null, timestamp: new Date().toISOString() };
  }
}
