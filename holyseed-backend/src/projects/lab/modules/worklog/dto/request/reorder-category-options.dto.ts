import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt } from 'class-validator';

export class ReorderCategoryOptionsDto {
  @ApiProperty({ description: '원하는 순서대로 나열한 분류 id 배열', example: [3, 1, 2] })
  @IsArray()
  @IsInt({ each: true })
  ids: number[];
}
