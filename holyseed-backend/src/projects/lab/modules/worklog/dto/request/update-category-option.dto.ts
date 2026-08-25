import { PartialType } from '@nestjs/swagger';
import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';
import { CreateCategoryOptionDto } from './create-category-option.dto';

export class UpdateCategoryOptionDto extends PartialType(CreateCategoryOptionDto) {
  @ApiProperty({ description: '수정할 분류 id', example: 1 })
  @IsInt()
  id: number;
}
