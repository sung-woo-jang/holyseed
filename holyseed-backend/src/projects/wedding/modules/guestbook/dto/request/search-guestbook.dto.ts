import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsUUID, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class SearchGuestbookDto {
  @ApiProperty({ description: '커플 ID (UUID)' })
  @IsUUID('4', { message: '유효한 커플 ID여야 합니다.' })
  coupleId: string;

  @ApiPropertyOptional({ description: '페이지당 개수', default: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => (value !== undefined ? Number(value) : 10))
  limit?: number = 10;

  @ApiPropertyOptional({ description: '오프셋', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => (value !== undefined ? Number(value) : 0))
  offset?: number = 0;
}
