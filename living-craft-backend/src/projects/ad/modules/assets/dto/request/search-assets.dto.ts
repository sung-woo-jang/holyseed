import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { AssetCategory } from '../../entities/asset.entity';

export class SearchAssetsDto {
  @ApiPropertyOptional({ enum: AssetCategory })
  @IsOptional()
  @IsEnum(AssetCategory)
  category?: AssetCategory;

  @ApiPropertyOptional({ description: '검색어' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ description: '아카이브 포함 여부', default: false })
  @IsOptional()
  @IsBoolean()
  includeArchived?: boolean;
}
