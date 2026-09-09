import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { LedgerCostType, LedgerType } from '../../entities';

export class CreateCategoryDto {
  @ApiProperty({ description: '카테고리명', example: '주거비' })
  @IsString()
  @MaxLength(50)
  name: string;

  @ApiProperty({ description: '아이콘 (이모지)', example: '🏠' })
  @IsString()
  @MaxLength(10)
  icon: string;

  @ApiProperty({ description: '색상 (hex)', example: '#F59E0B' })
  @IsString()
  @MaxLength(20)
  color: string;

  @ApiProperty({ description: '수입/지출 구분', enum: LedgerType })
  @IsEnum(LedgerType)
  type: LedgerType;

  @ApiPropertyOptional({ description: '기본 분류 (고정비/변동비, 지출만 해당)', enum: LedgerCostType })
  @IsOptional()
  @IsEnum(LedgerCostType)
  costType?: LedgerCostType | null;
}
