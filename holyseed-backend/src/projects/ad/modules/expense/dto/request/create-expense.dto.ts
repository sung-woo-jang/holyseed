import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { ExpenseKind, ExpenseType } from '../../entities';

export class CreateExpenseDto {
  @ApiProperty({ description: '항목', example: '월세' })
  @IsString()
  @MaxLength(200)
  @Transform(({ value }) => value?.trim())
  title: string;

  @ApiProperty({ description: '날짜', example: '2026-06-27' })
  @IsDateString({}, { message: '날짜는 YYYY-MM-DD 형식이어야 합니다.' })
  date: string;

  @ApiProperty({ description: '구분', enum: ExpenseKind })
  @IsEnum(ExpenseKind)
  kind: ExpenseKind;

  @ApiProperty({ description: '분류', example: '주거' })
  @IsString()
  @MaxLength(50)
  category: string;

  @ApiPropertyOptional({ description: '지출유형 (수입은 생략)', enum: ExpenseType })
  @IsOptional()
  @IsEnum(ExpenseType)
  expenseType?: ExpenseType | null;

  @ApiProperty({ description: '금액 (원)', example: 500000 })
  @IsInt()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ description: '메모' })
  @IsOptional()
  @IsString()
  memo?: string;
}
