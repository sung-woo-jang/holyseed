import { Controller, Get, Query, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '@common/decorators';
import { SuccessResponseDto } from '@common/dto/response';
import { PortfoliosService } from './portfolios.service';
import { PortfoliosQueryDto } from './dto/request';
import { PortfolioListResponseDto, PortfolioDetailDto } from './dto/response';

@Controller('portfolios')
@ApiTags('포트폴리오')
export class PortfoliosController {
  constructor(private readonly portfoliosService: PortfoliosService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: '포트폴리오 목록 조회' })
  @ApiResponse({
    status: 200,
    description: '조회 성공',
    type: PortfolioListResponseDto,
  })
  async findAll(
    @Query() query: PortfoliosQueryDto,
  ): Promise<SuccessResponseDto<PortfolioListResponseDto>> {
    const result = await this.portfoliosService.findAll(query);
    return new SuccessResponseDto(
      '포트폴리오 목록 조회에 성공했습니다.',
      result,
    );
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: '포트폴리오 상세 조회' })
  @ApiResponse({
    status: 200,
    description: '조회 성공',
    type: PortfolioDetailDto,
  })
  @ApiResponse({ status: 404, description: '포트폴리오를 찾을 수 없음' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<SuccessResponseDto<PortfolioDetailDto>> {
    const result = await this.portfoliosService.findById(id);
    return new SuccessResponseDto(
      '포트폴리오 상세 조회에 성공했습니다.',
      result,
    );
  }
}
