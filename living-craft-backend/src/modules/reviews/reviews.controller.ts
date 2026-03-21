import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
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
import { ReviewsService } from './reviews.service';
import { CreateReviewDto, ReviewsQueryDto } from './dto/request';
import { CreateReviewMultipartDto } from './dto/request/create-review-multipart.dto';
import {
  CreateReviewResponseDto,
  ReviewListResponseDto,
  MyReviewListResponseDto,
} from './dto/response';
import { CustomerJwtAuthGuard } from '@modules/customers/guards';
import {
  CurrentCustomer,
  ICurrentCustomer,
} from '@modules/customers/decorators';

@Controller('')
@ApiTags('리뷰')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('reviews')
  @Public()
  @ApiOperation({ summary: '리뷰 목록 조회' })
  @ApiResponse({
    status: 200,
    description: '조회 성공',
    type: ReviewListResponseDto,
  })
  async findAll(
    @Query() query: ReviewsQueryDto,
  ): Promise<SuccessResponseDto<ReviewListResponseDto>> {
    const result = await this.reviewsService.findAll(query);
    return new SuccessResponseDto('리뷰 목록 조회에 성공했습니다.', result);
  }

  @Post('reviews')
  @UseGuards(CustomerJwtAuthGuard)
  @UseInterceptors(FilesInterceptor('images', 5))
  @ApiBearerAuth()
  @ApiOperation({ summary: '리뷰 작성' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateReviewMultipartDto })
  @ApiResponse({
    status: 201,
    description: '리뷰 작성 성공',
    type: CreateReviewResponseDto,
  })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  async create(
    @Body() dto: CreateReviewDto,
    @UploadedFiles() imageFiles: Express.Multer.File[],
    @CurrentCustomer() customer: ICurrentCustomer,
  ): Promise<SuccessResponseDto<CreateReviewResponseDto>> {
    const result = await this.reviewsService.create(
      dto,
      imageFiles,
      customer.id,
    );
    return new SuccessResponseDto('리뷰가 작성되었습니다.', result);
  }

  @Get('users/me/reviews')
  @UseGuards(CustomerJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 리뷰 목록 조회' })
  @ApiResponse({
    status: 200,
    description: '조회 성공',
    type: MyReviewListResponseDto,
  })
  async findMyReviews(
    @Query('limit') limit: number = 10,
    @Query('offset') offset: number = 0,
    @CurrentCustomer() customer: ICurrentCustomer,
  ): Promise<SuccessResponseDto<MyReviewListResponseDto>> {
    const result = await this.reviewsService.findMyReviews(
      customer.id,
      limit,
      offset,
    );
    return new SuccessResponseDto('내 리뷰 목록 조회에 성공했습니다.', result);
  }
}
