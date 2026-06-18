import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { ModerationStatus } from '../../entities/wedding-media.entity';

export class SearchMediaDto {
  @ApiProperty({ description: '커플 ID (UUID)' })
  @IsUUID('4', { message: '유효한 커플 ID여야 합니다.' })
  coupleId: string;

  @ApiPropertyOptional({ enum: ModerationStatus, description: '검수 상태 필터' })
  @IsOptional()
  @IsEnum(ModerationStatus)
  moderationStatus?: ModerationStatus;

  @ApiPropertyOptional({ description: '페이지당 개수', default: 24 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => (value !== undefined ? Number(value) : 24))
  limit?: number = 24;

  @ApiPropertyOptional({ description: '오프셋', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => (value !== undefined ? Number(value) : 0))
  offset?: number = 0;
}
