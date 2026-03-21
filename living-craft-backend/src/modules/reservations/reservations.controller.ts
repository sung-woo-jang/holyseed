import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  UseInterceptors,
  UploadedFiles,
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
import { Public } from '@common/decorators';
import { SuccessResponseDto } from '@common/dto/response';
import { ReservationsService } from './reservations.service';
import {
  CreateReservationDto,
  AvailableTimesDto,
  AvailableDatesDto,
  ReservationsQueryDto,
  UpdateReservationStatusDto,
} from './dto/request';
import { CreateReservationMultipartDto } from './dto/request/create-reservation-multipart.dto';
import {
  CreateReservationResponseDto,
  ReservationDetailDto,
  AvailableTimesResponseDto,
  AvailableDatesResponseDto,
  MyReservationListResponseDto,
} from './dto/response';
import { CustomerJwtAuthGuard } from '@modules/customers/guards';
import {
  CurrentCustomer,
  ICurrentCustomer,
} from '@modules/customers/decorators';

@Controller('')
@ApiTags('예약')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post('services/available-times')
  @Public()
  @ApiOperation({ summary: '예약 가능 시간 조회' })
  @ApiResponse({
    status: 201,
    description: '조회 성공',
    type: AvailableTimesResponseDto,
  })
  async getAvailableTimes(
    @Body() dto: AvailableTimesDto,
  ): Promise<SuccessResponseDto<AvailableTimesResponseDto>> {
    const result = await this.reservationsService.getAvailableTimes(dto);
    return new SuccessResponseDto(
      '예약 가능 시간 조회에 성공했습니다.',
      result,
    );
  }

  @Post('services/available-dates')
  @Public()
  @ApiOperation({ summary: '월별 예약 가능 날짜 조회' })
  @ApiResponse({
    status: 201,
    description: '조회 성공',
    type: AvailableDatesResponseDto,
  })
  async getAvailableDates(
    @Body() dto: AvailableDatesDto,
  ): Promise<SuccessResponseDto<AvailableDatesResponseDto>> {
    const result = await this.reservationsService.getAvailableDates(dto);
    return new SuccessResponseDto(
      '월별 예약 가능 날짜 조회에 성공했습니다.',
      result,
    );
  }

  @Post('reservations')
  @UseGuards(CustomerJwtAuthGuard)
  @UseInterceptors(FilesInterceptor('photos', 5))
  @ApiBearerAuth()
  @ApiOperation({ summary: '예약 생성' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateReservationMultipartDto })
  @ApiResponse({
    status: 201,
    description: '예약 생성 성공',
    type: CreateReservationResponseDto,
  })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  async create(
    @Body() dto: CreateReservationDto,
    @UploadedFiles() photos: Express.Multer.File[],
    @CurrentCustomer() customer: ICurrentCustomer,
  ): Promise<SuccessResponseDto<CreateReservationResponseDto>> {
    const result = await this.reservationsService.create(
      dto,
      photos,
      customer.id,
    );
    return new SuccessResponseDto('예약이 생성되었습니다.', result);
  }

  @Get('reservations/:id')
  @UseGuards(CustomerJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '예약 상세 조회' })
  @ApiResponse({
    status: 200,
    description: '조회 성공',
    type: ReservationDetailDto,
  })
  @ApiResponse({ status: 404, description: '예약을 찾을 수 없음' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentCustomer() customer: ICurrentCustomer,
  ): Promise<SuccessResponseDto<ReservationDetailDto>> {
    const result = await this.reservationsService.findById(id, customer.id);
    return new SuccessResponseDto('예약 상세 조회에 성공했습니다.', result);
  }

  @Post('reservations/:id/cancel')
  @UseGuards(CustomerJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '예약 취소' })
  @ApiResponse({
    status: 201,
    description: '취소 성공',
    type: ReservationDetailDto,
  })
  @ApiResponse({ status: 400, description: '취소할 수 없는 상태' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @ApiResponse({ status: 404, description: '예약을 찾을 수 없음' })
  async cancel(
    @Param('id', ParseIntPipe) id: number,
    @CurrentCustomer() customer: ICurrentCustomer,
  ): Promise<SuccessResponseDto<ReservationDetailDto>> {
    const result = await this.reservationsService.cancel(id, customer.id);
    return new SuccessResponseDto('예약이 취소되었습니다.', result);
  }

  @Get('users/me/reservations')
  @UseGuards(CustomerJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 예약 목록 조회' })
  @ApiResponse({
    status: 200,
    description: '조회 성공',
    type: MyReservationListResponseDto,
  })
  async findMyReservations(
    @Query() query: ReservationsQueryDto,
    @CurrentCustomer() customer: ICurrentCustomer,
  ): Promise<SuccessResponseDto<MyReservationListResponseDto>> {
    const result = await this.reservationsService.findMyReservations(
      customer.id,
      query,
    );
    return new SuccessResponseDto('내 예약 목록 조회에 성공했습니다.', result);
  }

  @Post('admin/reservations/:id/status')
  @ApiOperation({ summary: '[관리자] 예약 상태 변경' })
  @ApiResponse({
    status: 201,
    description: '상태 변경 성공',
    type: ReservationDetailDto,
  })
  @ApiResponse({ status: 400, description: '잘못된 상태 전환' })
  @ApiResponse({ status: 404, description: '예약을 찾을 수 없음' })
  async updateReservationStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateReservationStatusDto,
  ): Promise<SuccessResponseDto<ReservationDetailDto>> {
    const result = await this.reservationsService.updateStatus(
      id,
      dto.status,
    );
    return new SuccessResponseDto('예약 상태가 변경되었습니다.', result);
  }
}
