import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Public } from '@common/decorators';
import { SuccessResponseDto } from '@common/dto/response';
import { SettingsService } from './settings.service';
import { UpdateOperatingHoursDto, AddHolidayDto } from './dto/request';
import { OperatingHoursResponseDto } from './dto/response';

@Controller('admin/settings')
@ApiTags('관리자 - 운영 설정')
@ApiBearerAuth()
@Public()
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('operating-hours')
  @ApiOperation({ summary: '운영 시간 조회' })
  @ApiResponse({
    status: 200,
    description: '조회 성공',
    type: OperatingHoursResponseDto,
  })
  async getOperatingHours(): Promise<
    SuccessResponseDto<OperatingHoursResponseDto>
  > {
    const result = await this.settingsService.getOperatingHours();
    return new SuccessResponseDto('운영 시간 조회에 성공했습니다.', result);
  }

  @Post('operating-hours')
  @ApiOperation({ summary: '운영 시간 수정' })
  @ApiResponse({
    status: 201,
    description: '수정 성공',
    type: OperatingHoursResponseDto,
  })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  async updateOperatingHours(
    @Body() dto: UpdateOperatingHoursDto,
  ): Promise<SuccessResponseDto<OperatingHoursResponseDto>> {
    const result = await this.settingsService.updateOperatingHours(dto);
    return new SuccessResponseDto('운영 시간이 수정되었습니다.', result);
  }

  @Post('holidays')
  @ApiOperation({ summary: '휴무일 추가' })
  @ApiResponse({
    status: 201,
    description: '추가 성공',
    type: [String],
  })
  @ApiResponse({ status: 400, description: '이미 등록된 휴무일' })
  async addHoliday(
    @Body() dto: AddHolidayDto,
  ): Promise<SuccessResponseDto<string[]>> {
    const result = await this.settingsService.addHoliday(dto);
    return new SuccessResponseDto('휴무일이 추가되었습니다.', result);
  }

  @Post('holidays/:date/delete')
  @ApiOperation({ summary: '휴무일 삭제' })
  @ApiResponse({
    status: 201,
    description: '삭제 성공',
    type: [String],
  })
  @ApiResponse({ status: 404, description: '휴무일을 찾을 수 없음' })
  async deleteHoliday(
    @Param('date') date: string,
  ): Promise<SuccessResponseDto<string[]>> {
    const result = await this.settingsService.deleteHoliday(date);
    return new SuccessResponseDto('휴무일이 삭제되었습니다.', result);
  }
}
