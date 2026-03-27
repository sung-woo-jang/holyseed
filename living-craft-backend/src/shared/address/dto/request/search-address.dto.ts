import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SearchAddressDto {
  @ApiProperty({ description: '검색어', example: '컨벤시아대로' })
  @IsString()
  @IsNotEmpty({ message: '검색어를 입력해주세요.' })
  @Transform(({ value }) => value?.trim())
  query: string;

  @ApiPropertyOptional({
    description: '지역 접두어',
    example: '인천 연수구',
    default: '인천',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim() || '인천')
  regionPrefix?: string;
}
