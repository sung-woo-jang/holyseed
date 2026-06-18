import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsEnum, IsNumber, IsOptional, IsPositive, IsString, Max, MaxLength, Min, ValidateIf } from 'class-validator';
import { TransactionType } from '../../../transactions/entities/transaction.entity';
import { RecurringFrequency } from '../../entities/recurring-transaction.entity';

export class CreateRecurringDto {
  @ApiProperty({ enum: TransactionType })
  @IsEnum(TransactionType)
  type: TransactionType;

  @ApiPropertyOptional({ description: '변동형 여부 (매월 금액이 다름)', default: false })
  @IsOptional()
  @IsBoolean()
  isVariable?: boolean;

  @ApiPropertyOptional({ description: '금액 (고정형 필수, 변동형은 선택/예상치)', example: 50000 })
  @ValidateIf((o) => !o.isVariable)
  @IsNumber()
  @IsPositive()
  @ValidateIf((o) => o.isVariable)
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @ApiPropertyOptional({ description: '제목', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ description: '카테고리 ID' })
  @IsOptional()
  @IsNumber()
  categoryId?: number;

  @ApiPropertyOptional({ description: '출금 자산 ID' })
  @IsOptional()
  @IsNumber()
  fromAssetId?: number;

  @ApiPropertyOptional({ description: '입금 자산 ID' })
  @IsOptional()
  @IsNumber()
  toAssetId?: number;

  @ApiPropertyOptional({ description: '메모' })
  @IsOptional()
  @IsString()
  memo?: string;

  @ApiProperty({ enum: RecurringFrequency, default: RecurringFrequency.MONTHLY })
  @IsEnum(RecurringFrequency)
  frequency: RecurringFrequency;

  @ApiProperty({ description: '실행 일 (1~31)', example: 25 })
  @IsNumber()
  @Min(1)
  @Max(31)
  dayOfMonth: number;

  @ApiPropertyOptional({ description: '실행 월 (YEARLY 시 필요, 1~12)', example: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(12)
  monthOfYear?: number;

  @ApiProperty({ description: '시작 날짜 (YYYY-MM-DD)', example: '2024-01-01' })
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({ description: '종료 날짜 (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
