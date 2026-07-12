import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';
import { AssetCategory } from '../../entities/asset.entity';

export class CreateAssetDto {
  @ApiProperty({ description: '자산명' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ enum: AssetCategory })
  @IsEnum(AssetCategory)
  category: AssetCategory;

  @ApiPropertyOptional({ description: '통화', default: 'KRW' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: '부채 여부', default: false })
  @IsOptional()
  @IsBoolean()
  isLiability?: boolean;

  @ApiPropertyOptional({ description: '메모' })
  @IsOptional()
  @IsString()
  memo?: string;

  @ApiPropertyOptional({ description: '정렬 순서' })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}
