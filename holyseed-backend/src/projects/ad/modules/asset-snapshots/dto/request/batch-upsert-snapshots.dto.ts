import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsNumber, IsPositive, ValidateNested } from 'class-validator';
import { UpsertSnapshotDto } from './upsert-snapshot.dto';

export class BatchSnapshotItem extends UpsertSnapshotDto {
  @ApiProperty({ description: '자산 ID' })
  @IsNumber()
  @IsPositive()
  assetId: number;
}

export class BatchUpsertSnapshotsDto {
  @ApiProperty({ type: [BatchSnapshotItem] })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => BatchSnapshotItem)
  items: BatchSnapshotItem[];
}
