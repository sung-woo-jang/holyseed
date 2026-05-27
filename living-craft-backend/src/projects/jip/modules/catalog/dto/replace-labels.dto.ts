import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class ReplaceLabelsDto {
  @ApiProperty({ type: [String], example: ['고급 마감', '10년 보증'] })
  @IsArray()
  @IsString({ each: true })
  labels: string[];
}
