import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsObject,
  IsNumber,
  IsBoolean,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class FixedPositionDto {
  @ApiPropertyOptional({
    description: 'X 좌표',
    example: 0,
  })
  @IsNumber()
  x: number;

  @ApiPropertyOptional({
    description: 'Y 좌표',
    example: 0,
  })
  @IsNumber()
  y: number;

  @ApiPropertyOptional({
    description: '폭',
    example: 500,
  })
  @IsNumber()
  width: number;

  @ApiPropertyOptional({
    description: '높이',
    example: 400,
  })
  @IsNumber()
  height: number;

  @ApiPropertyOptional({
    description: '회전 여부',
    example: false,
  })
  @IsBoolean()
  rotated: boolean;
}

export class TogglePieceCompleteDto {
  @ApiPropertyOptional({
    description: '완료된 조각의 고정 위치 (완료로 전환 시 필요)',
    type: FixedPositionDto,
    example: { x: 0, y: 0, width: 500, height: 400, rotated: false },
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => FixedPositionDto)
  fixedPosition?: {
    x: number;
    y: number;
    width: number;
    height: number;
    rotated: boolean;
  };
}
