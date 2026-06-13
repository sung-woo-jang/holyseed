import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';

export class SettleWorkLogDto {
  @ApiPropertyOptional({ description: '수령 시 입금 자산 ID (미지정 시 근무 기록의 자산)' })
  @IsOptional()
  @IsNumber()
  toAssetId?: number;

  @ApiPropertyOptional({ description: '카테고리 ID (미지정 시 근무 기록의 카테고리)' })
  @IsOptional()
  @IsNumber()
  categoryId?: number;
}
