import { ApiProperty } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';

export class DeleteSnapshotDto {
  @ApiProperty({ description: '삭제할 날짜 (YYYY-MM-DD)' })
  @IsDateString()
  date: string;
}
