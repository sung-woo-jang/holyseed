import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CoupleBySlugDto {
  @ApiProperty({ description: '커플 slug', example: 'sungwoo-minji' })
  @IsString()
  @MaxLength(100)
  @Matches(/^[a-z0-9-]+$/, { message: 'slug 형식이 올바르지 않습니다.' })
  @Transform(({ value }) => value?.trim().toLowerCase())
  slug: string;
}
