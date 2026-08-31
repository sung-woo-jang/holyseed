import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class SetFeaturedMediaDto {
  @ApiProperty({ description: '오늘의 TOP 5 추억에 지정할지 여부' })
  @IsBoolean()
  isFeatured: boolean;
}
