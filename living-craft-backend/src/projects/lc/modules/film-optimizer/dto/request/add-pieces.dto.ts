import { IsArray, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CuttingPieceInputDto } from './create-cutting-project.dto';

/**
 * 재단 조각 일괄 추가 DTO
 */
export class AddPiecesDto {
  @ApiProperty({
    description: '추가할 재단 조각 목록',
    type: [CuttingPieceInputDto],
  })
  @IsArray({ message: '조각 목록은 배열이어야 합니다.' })
  @ArrayMinSize(1, { message: '최소 1개 이상의 조각을 입력해주세요.' })
  @ValidateNested({ each: true })
  @Type(() => CuttingPieceInputDto)
  pieces: CuttingPieceInputDto[];
}
