import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsString, MaxLength } from 'class-validator';

export class BulkUpdateWithholdingDto {
  @ApiProperty({ description: '분류명 — 이 분류에 속한 근무 기록 전체가 대상', example: '에폭시' })
  @IsString()
  @MaxLength(50)
  category: string;

  @ApiProperty({ description: '원천징수(3.3%) 적용 여부', example: false })
  @IsBoolean()
  withholdingApplied: boolean;
}
