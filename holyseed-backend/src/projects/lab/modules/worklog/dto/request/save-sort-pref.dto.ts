import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class SaveSortPrefDto {
  @ApiProperty({
    description: '정렬 기준',
    enum: ['workDate', 'title', 'amount', 'net', 'category'],
    example: 'workDate',
  })
  @IsIn(['workDate', 'title', 'amount', 'net', 'category'])
  key: string;

  @ApiProperty({ description: '정렬 방향', enum: ['asc', 'desc'], example: 'desc' })
  @IsIn(['asc', 'desc'])
  dir: 'asc' | 'desc';
}
