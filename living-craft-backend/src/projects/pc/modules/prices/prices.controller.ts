import { Body, Controller, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PricesService } from './prices.service';
import { UpsertPriceDto } from './dto/request/upsert-price.dto';

@ApiTags('PC 가격')
@Controller('jip/pc/prices')
export class PricesController {
  constructor(private readonly pricesService: PricesService) {}

  @Post()
  @ApiOperation({ summary: '가격 등록/수정 (productId+vendorId 기준 upsert)' })
  async upsert(@Body() dto: UpsertPriceDto) {
    const data = await this.pricesService.upsert(dto);
    return { success: true, message: '가격 등록/수정 성공', data, timestamp: new Date().toISOString() };
  }

  @Post(':id/delete')
  @ApiOperation({ summary: '가격 삭제' })
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.pricesService.delete(id);
    return { success: true, message: '가격 삭제 성공', data: null, timestamp: new Date().toISOString() };
  }
}
