import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '@common/decorators';
import { SuccessResponseDto } from '@common/dto/response';
import { AddressService } from './address.service';
import { SearchAddressDto } from './dto/request';
import { AddressSearchResponseDto } from './dto/response';

@Controller('address')
@ApiTags('주소 검색')
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @Get('search')
  @Public()
  @ApiOperation({ summary: '주소 검색 (카카오 API 프록시)' })
  @ApiResponse({ status: 200, description: '검색 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청 데이터' })
  @ApiResponse({ status: 401, description: '카카오 API 인증 실패' })
  @ApiResponse({ status: 429, description: '요청 한도 초과' })
  @ApiResponse({ status: 408, description: '요청 시간 초과' })
  async searchAddress(
    @Query() dto: SearchAddressDto,
  ): Promise<SuccessResponseDto<AddressSearchResponseDto>> {
    const result = await this.addressService.searchAddress(dto);
    return new SuccessResponseDto('주소 검색이 완료되었습니다.', result);
  }
}
