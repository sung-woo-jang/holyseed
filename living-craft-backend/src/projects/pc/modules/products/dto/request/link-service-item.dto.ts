import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class LinkServiceItemDto {
  @ApiPropertyOptional({ description: 'ServiceItem ID (null이면 연결 해제)', example: 1, nullable: true })
  @IsOptional()
  @IsInt()
  serviceItemId?: number | null;

  @ApiPropertyOptional({ description: '고객 URL 코드 (고유)', example: 'k1-1' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  @Transform(({ value }) => value?.trim() || null)
  code?: string | null;

  @ApiPropertyOptional({ description: '일러스트 종류', example: 'hood', default: 'default' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  illustKind?: string;

  @ApiPropertyOptional({ description: '노출 순서 (ServiceItem 안에서)', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
