import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsDateString, IsNumber, ValidateNested } from 'class-validator';

export class ApplyMissedItemDto {
  @ApiProperty({ description: '정기거래 템플릿 ID', example: 1 })
  @IsNumber({}, { message: '정기거래 ID는 숫자여야 합니다.' })
  recurringId: number;

  @ApiProperty({ description: '반영할 지정일 (YYYY-MM-DD)', example: '2026-06-25' })
  @IsDateString({}, { message: '날짜는 YYYY-MM-DD 형식이어야 합니다.' })
  date: string;
}

export class ApplyMissedDto {
  @ApiProperty({ description: '반영할 누락 항목 목록', type: [ApplyMissedItemDto] })
  @IsArray({ message: '항목 목록은 배열이어야 합니다.' })
  @ArrayNotEmpty({ message: '반영할 항목이 없습니다.' })
  @ValidateNested({ each: true })
  @Type(() => ApplyMissedItemDto)
  items: ApplyMissedItemDto[];
}
