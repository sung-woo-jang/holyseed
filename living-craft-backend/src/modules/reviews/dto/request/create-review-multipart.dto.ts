import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateReviewDto } from './create-review.dto';

export class CreateReviewMultipartDto extends CreateReviewDto {
  @ApiPropertyOptional({
    description: '리뷰 이미지 파일들 (최대 5개)',
    type: 'array',
    items: { type: 'string', format: 'binary' },
  })
  images?: any;
}
