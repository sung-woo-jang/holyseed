import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class SearchContentRowsDto {
  @ApiProperty({ description: '커플 ID (UUID)' })
  @IsString()
  coupleId: string;

  @ApiPropertyOptional({ description: '숨김 행 포함 여부 (관리자 전용)', default: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === 'true')
  includeHidden?: boolean = false;
}
