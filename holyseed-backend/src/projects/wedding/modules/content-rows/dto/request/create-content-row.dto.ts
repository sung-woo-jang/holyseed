import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsEnum, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { ContentRowType } from '../../entities/wedding-content-row.entity';

export class CreateContentRowDto {
  @ApiProperty({ description: '커플 ID (UUID)' })
  @IsString()
  coupleId: string;

  @ApiProperty({ description: '행 제목', example: '우리의 이야기' })
  @IsString()
  @MaxLength(200)
  @Transform(({ value }) => value?.trim())
  title: string;

  @ApiProperty({ enum: ContentRowType })
  @IsEnum(ContentRowType, { message: '유효한 행 타입이어야 합니다.' })
  rowType: ContentRowType;

  @ApiPropertyOptional({ description: '정렬 순서', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => (value !== undefined ? Number(value) : 0))
  order?: number = 0;

  @ApiPropertyOptional({ description: '공개 여부', default: true })
  @IsOptional()
  @IsBoolean()
  isVisible?: boolean = true;

  @ApiPropertyOptional({ description: '아이템 배열', type: Array })
  @IsOptional()
  @IsArray()
  items?: Record<string, any>[];
}
