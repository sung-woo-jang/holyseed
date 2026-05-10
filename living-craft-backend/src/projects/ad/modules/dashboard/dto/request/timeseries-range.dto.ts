import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export enum TimeseriesRange {
  ONE_YEAR = '1Y',
  THREE_YEAR = '3Y',
  FIVE_YEAR = '5Y',
  ALL = 'ALL',
}

export class TimeseriesRangeDto {
  @ApiProperty({ enum: TimeseriesRange, default: TimeseriesRange.FIVE_YEAR })
  @IsEnum(TimeseriesRange)
  range: TimeseriesRange;
}
