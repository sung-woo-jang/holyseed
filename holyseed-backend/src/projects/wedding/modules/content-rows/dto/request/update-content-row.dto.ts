import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsEnum, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { ContentRowType } from '../../entities/wedding-content-row.entity';

export class UpdateContentRowDto {
  @ApiPropertyOptional({ description: '행 제목' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Transform(({ value }) => value?.trim())
  title?: string;

  @ApiPropertyOptional({ enum: ContentRowType })
  @IsOptional()
  @IsEnum(ContentRowType)
  rowType?: ContentRowType;

  @ApiPropertyOptional({ description: '정렬 순서' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  order?: number;

  @ApiPropertyOptional({ description: '공개 여부' })
  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;

  @ApiPropertyOptional({ description: '아이템 배열' })
  @IsOptional()
  @IsArray()
  items?: Record<string, any>[];
}
