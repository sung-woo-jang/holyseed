import { ApiPropertyOptional } from '@nestjs/swagger';
import { UpdatePortfolioDto } from './update-portfolio.dto';

export class UpdatePortfolioMultipartDto extends UpdatePortfolioDto {
  @ApiPropertyOptional({
    description: '포트폴리오 이미지 파일들 (선택적)',
    type: 'array',
    items: { type: 'string', format: 'binary' },
  })
  images?: any;
}
