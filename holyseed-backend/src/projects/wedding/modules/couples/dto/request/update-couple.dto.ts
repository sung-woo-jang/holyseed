import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';

class AccountInfoDto {
  @ApiPropertyOptional({ description: '관계 (신랑측/신부측 등)' })
  @IsOptional()
  @IsString()
  relation?: string;

  @ApiPropertyOptional({ description: '예금주' })
  @IsOptional()
  @IsString()
  holder?: string;

  @ApiPropertyOptional({ description: '은행명' })
  @IsOptional()
  @IsString()
  bank?: string;

  @ApiPropertyOptional({ description: '계좌번호' })
  @IsOptional()
  @IsString()
  account?: string;
}

export class UpdateCoupleDto {
  @ApiPropertyOptional({ description: '신랑 이름' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(({ value }) => value?.trim())
  groomName?: string;

  @ApiPropertyOptional({ description: '신부 이름' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(({ value }) => value?.trim())
  brideName?: string;

  @ApiPropertyOptional({ description: '결혼식 일시 (ISO 8601)', example: '2026-09-20T11:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  weddingDate?: string;

  @ApiPropertyOptional({ description: '예식장 정보 (name, address, lat, lng, hall, floor)' })
  @IsOptional()
  weddingVenue?: Record<string, any>;

  @ApiPropertyOptional({ description: '계좌 정보 배열' })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AccountInfoDto)
  accountInfo?: AccountInfoDto[];

  @ApiPropertyOptional({ description: '테마 설정' })
  @IsOptional()
  themeSettings?: Record<string, any>;
}
