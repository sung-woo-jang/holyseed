import { ApiProperty } from '@nestjs/swagger';
import { CreatePortfolioDto } from './create-portfolio.dto';

export class CreatePortfolioMultipartDto extends CreatePortfolioDto {
  @ApiProperty({
    description: '포트폴리오 이미지 파일들',
    type: 'array',
    items: { type: 'string', format: 'binary' },
  })
  images: any;
}
