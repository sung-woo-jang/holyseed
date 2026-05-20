import { IsString, IsOptional, IsBoolean, IsNumber, MaxLength, Min, IsEmail } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateVendorDto {
  @ApiProperty({ description: '업체명', example: 'A마트' })
  @IsString({ message: '업체명은 문자열이어야 합니다.' })
  @MaxLength(120, { message: '업체명은 120자를 초과할 수 없습니다.' })
  @Transform(({ value }) => value?.trim())
  name: string;

  @ApiPropertyOptional({ description: '담당자', example: '홍길동' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Transform(({ value }) => value?.trim())
  contact?: string;

  @ApiPropertyOptional({ description: '전화번호', example: '02-1234-5678' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @ApiPropertyOptional({ description: '이메일', example: 'vendor@example.com' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  email?: string;

  @ApiPropertyOptional({ description: '홈페이지', example: 'https://vendor.com' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  homepage?: string;

  @ApiPropertyOptional({ description: '메모' })
  @IsOptional()
  @IsString()
  memo?: string;

  @ApiPropertyOptional({ description: '활성 여부', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: '정렬 순서', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sortOrder?: number;
}
