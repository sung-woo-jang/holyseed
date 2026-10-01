import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateJobOptionDto {
  @ApiProperty({ description: '업무 이름', example: '타일' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  @Transform(({ value }) => value?.trim())
  name: string;
}
