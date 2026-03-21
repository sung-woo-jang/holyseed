import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '@common/decorators';
import { SuccessResponseDto } from '@common/dto/response';
import { IconsService } from './icons.service';
import { IconType } from './enums/icon-type.enum';
import {
  IconListDto,
  IconListPaginatedDto,
  CreateIconDto,
  UpdateIconDto,
} from '@modules/icons/dto';
import { Icon } from './entities/icon.entity';

@Controller('icons')
@ApiTags('아이콘')
export class IconsController {
  constructor(private readonly iconsService: IconsService) {}

  @Get()
  @Public()
  @ApiOperation({
    summary: '아이콘 목록 조회 (페이지네이션)',
    description:
      '등록된 모든 아이콘을 페이지네이션으로 조회합니다. 타입별 필터링 및 이름 검색 가능.',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: IconType,
    description: '아이콘 타입 필터 (FILL, MONO, COLOR)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: '아이콘 이름 검색어',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: '최대 결과 개수 (기본: 100, 최대: 500)',
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: '건너뛸 개수 (기본: 0)',
  })
  @ApiResponse({
    status: 200,
    description: '아이콘 목록 조회 성공',
    type: IconListPaginatedDto,
  })
  async findAll(
    @Query('type') type?: IconType,
    @Query('search') search?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<SuccessResponseDto<IconListPaginatedDto>> {
    const result = await this.iconsService.findAll(type, search, limit, offset);
    return new SuccessResponseDto('아이콘 목록 조회에 성공했습니다.', result);
  }

  @Post('admin')
  @ApiOperation({
    summary: '아이콘 생성 (관리자)',
    description: '새로운 아이콘을 생성합니다. 중복된 이름은 허용되지 않습니다.',
  })
  @ApiResponse({
    status: 201,
    description: '아이콘 생성 성공',
    type: Icon,
  })
  @ApiResponse({
    status: 400,
    description: '중복된 아이콘 이름',
  })
  async createIcon(
    @Body() dto: CreateIconDto,
  ): Promise<SuccessResponseDto<Icon>> {
    const icon = await this.iconsService.createIcon(dto);
    return new SuccessResponseDto('아이콘이 생성되었습니다.', icon);
  }

  @Post('admin/:id/update')
  @ApiOperation({
    summary: '아이콘 수정 (관리자)',
    description: '아이콘 정보를 수정합니다. 중복된 이름은 허용되지 않습니다.',
  })
  @ApiResponse({
    status: 200,
    description: '아이콘 수정 성공',
    type: Icon,
  })
  @ApiResponse({
    status: 404,
    description: '아이콘을 찾을 수 없음',
  })
  @ApiResponse({
    status: 400,
    description: '중복된 아이콘 이름',
  })
  async updateIcon(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateIconDto,
  ): Promise<SuccessResponseDto<Icon>> {
    const icon = await this.iconsService.updateIcon(id, dto);
    return new SuccessResponseDto('아이콘이 수정되었습니다.', icon);
  }
}
