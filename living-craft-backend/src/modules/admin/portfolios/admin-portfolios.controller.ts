import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { SuccessResponseDto } from '@common/dto/response/success-response.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@common/enums';
import { AdminPortfoliosService } from './admin-portfolios.service';
import {
  CreatePortfolioDto,
  UpdatePortfolioDto,
  AdminPortfoliosQueryDto,
} from './dto/request';
import { CreatePortfolioMultipartDto } from './dto/request/create-portfolio-multipart.dto';
import { UpdatePortfolioMultipartDto } from './dto/request/update-portfolio-multipart.dto';
import { Portfolio } from '@modules/portfolios/entities';

@Controller('admin/portfolios')
@ApiTags('관리자 > 포트폴리오 관리')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPERADMIN)
export class AdminPortfoliosController {
  constructor(
    private readonly adminPortfoliosService: AdminPortfoliosService,
  ) {}

  @Get()
  @ApiOperation({ summary: '포트폴리오 목록 조회' })
  @ApiResponse({ status: 200, description: '조회 성공' })
  async findAll(
    @Query() query: AdminPortfoliosQueryDto,
  ): Promise<SuccessResponseDto<{ items: Portfolio[]; total: number }>> {
    const result = await this.adminPortfoliosService.findAll(query);
    return new SuccessResponseDto(
      '포트폴리오 목록 조회에 성공했습니다.',
      result,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: '포트폴리오 상세 조회' })
  @ApiResponse({ status: 200, description: '조회 성공' })
  @ApiResponse({ status: 404, description: '포트폴리오를 찾을 수 없음' })
  async findById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<SuccessResponseDto<Portfolio>> {
    const result = await this.adminPortfoliosService.findById(id);
    return new SuccessResponseDto(
      '포트폴리오 상세 조회에 성공했습니다.',
      result,
    );
  }

  @Post()
  @UseInterceptors(FilesInterceptor('images', 10))
  @ApiOperation({ summary: '포트폴리오 생성' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreatePortfolioMultipartDto })
  @ApiResponse({ status: 201, description: '생성 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청 데이터' })
  async create(
    @Body() dto: CreatePortfolioDto,
    @UploadedFiles() imageFiles: Express.Multer.File[],
  ): Promise<SuccessResponseDto<Portfolio>> {
    if (!imageFiles || imageFiles.length === 0) {
      throw new BadRequestException('최소 1개 이상의 이미지가 필요합니다.');
    }
    const result = await this.adminPortfoliosService.create(dto, imageFiles);
    return new SuccessResponseDto('포트폴리오가 생성되었습니다.', result);
  }

  @Post(':id')
  @UseInterceptors(FilesInterceptor('images', 10))
  @ApiOperation({ summary: '포트폴리오 수정' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UpdatePortfolioMultipartDto })
  @ApiResponse({ status: 200, description: '수정 성공' })
  @ApiResponse({ status: 404, description: '포트폴리오를 찾을 수 없음' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePortfolioDto,
    @UploadedFiles() imageFiles: Express.Multer.File[],
  ): Promise<SuccessResponseDto<Portfolio>> {
    const result = await this.adminPortfoliosService.update(
      id,
      dto,
      imageFiles,
    );
    return new SuccessResponseDto('포트폴리오가 수정되었습니다.', result);
  }

  @Post(':id/delete')
  @ApiOperation({ summary: '포트폴리오 삭제' })
  @ApiResponse({ status: 200, description: '삭제 성공' })
  @ApiResponse({ status: 404, description: '포트폴리오를 찾을 수 없음' })
  async delete(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<SuccessResponseDto<void>> {
    await this.adminPortfoliosService.delete(id);
    return new SuccessResponseDto('포트폴리오가 삭제되었습니다.');
  }
}
