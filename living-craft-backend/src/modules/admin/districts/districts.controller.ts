import { Controller, Post, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@common/enums/user-role.enum';
import { SuccessResponseDto } from '@common/dto/response/success-response.dto';
import { DistrictsService } from './districts.service';
import { DistrictDto } from './dto/response/district.dto';
import { DistrictLevel } from '@common/enums/district-level.enum';

@ApiTags('관리자 > 행정구역 관리')
@ApiBearerAuth()
@Controller('admin/districts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPERADMIN)
export class DistrictsController {
  constructor(private readonly districtsService: DistrictsService) {}

  /**
   * 행정구역 목록 조회 (레벨, 부모 ID 필터링 가능)
   */
  @Get()
  @ApiOperation({
    summary: '행정구역 목록 조회',
    description:
      '행정구역 목록을 조회합니다. level, parentId 쿼리 파라미터로 필터링 가능합니다.',
  })
  @ApiQuery({
    name: 'level',
    required: false,
    enum: DistrictLevel,
    description: '조회할 행정구역 레벨 (SIDO, SIGUNGU, EUPMYEONDONG)',
  })
  @ApiQuery({
    name: 'parentId',
    required: false,
    type: Number,
    description: '상위 행정구역 ID (하위 지역 조회 시 사용)',
  })
  @ApiResponse({
    status: 200,
    description: '조회 성공',
    type: [DistrictDto],
  })
  async findAll(
    @Query('level') level?: DistrictLevel,
    @Query('parentId') parentId?: number,
  ): Promise<SuccessResponseDto<DistrictDto[]>> {
    const districts = await this.districtsService.findAll(level, parentId);
    return new SuccessResponseDto(
      '행정구역 목록 조회에 성공했습니다.',
      districts,
    );
  }

  /**
   * 1단계: 법정동 코드.txt 파일을 JSON으로 변환
   * - 폐지된 구역 제외
   * - 리(RI) 레벨 제외
   * - data/districts.json 파일 생성
   */
  @Post('convert-txt-to-json')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  @ApiOperation({
    summary: '1단계: TXT → JSON 변환 (폐지 제외)',
    description:
      '법정동 코드.txt 파일을 읽어서 JSON 파일로 변환합니다. 폐지된 구역과 리(RI) 레벨은 제외됩니다.',
  })
  @ApiResponse({
    status: 200,
    description: '변환 성공',
    schema: {
      example: {
        success: true,
        message: 'TXT 파일을 JSON으로 변환했습니다.',
        data: {
          message: 'TXT 파일을 JSON으로 변환했습니다.',
          filePath: '/path/to/data/districts.json',
          recordCount: 20553,
        },
        timestamp: '2024-01-01T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: '변환 실패 (파일 없음, 읽기 오류 등)',
  })
  async convertTxtToJson(): Promise<
    SuccessResponseDto<{
      message: string;
      filePath: string;
      recordCount: number;
    }>
  > {
    const result = await this.districtsService.convertTxtToJson();
    return new SuccessResponseDto(result.message, result);
  }

  /**
   * 2단계: JSON 파일에서 DB로 import
   * - 트랜잭션 처리
   * - 레벨별 순차 처리 (부모-자식 관계 보장)
   * - 배치 처리 (500개씩)
   */
  @Post('import-from-json')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  @ApiOperation({
    summary: '2단계: JSON → DB Import',
    description:
      'data/districts.json 파일에서 데이터를 읽어 DB로 import합니다. 기존 데이터는 모두 삭제되고 새로 생성됩니다.',
  })
  @ApiResponse({
    status: 200,
    description: 'Import 성공',
    schema: {
      example: {
        success: true,
        message: 'Import가 완료되었습니다.',
        data: {
          totalProcessed: 20553,
          created: 20553,
          errors: 0,
          durationMs: 15234,
          errorMessages: [],
        },
        timestamp: '2024-01-01T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Import 실패 (파일 없음, DB 오류 등)',
  })
  async importFromJson(): Promise<
    SuccessResponseDto<{
      totalProcessed: number;
      created: number;
      errors: number;
      durationMs: number;
      errorMessages: string[];
    }>
  > {
    const result = await this.districtsService.importFromJson();
    return new SuccessResponseDto('Import가 완료되었습니다.', result);
  }
}
