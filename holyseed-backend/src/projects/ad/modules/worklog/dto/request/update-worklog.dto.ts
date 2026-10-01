import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Transform } from 'class-transformer';
import { WorklogPhoto } from '../../entities';
import { CreateWorklogDto } from './create-worklog.dto';

export class UpdateWorklogDto extends PartialType(CreateWorklogDto) {
  // PartialType이 photos 필드의 class-transformer 변환 메타데이터를 제대로 상속하지 못해
  // (근무 사진이 [] 형태로 손상되어 저장되는 버그의 원인) 여기서 동일한 데코레이터로 재선언한다.
  @ApiPropertyOptional({ description: '근무 사진', type: [WorklogPhoto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value.map((v) => Object.assign(new WorklogPhoto(), v)) : value))
  photos?: WorklogPhoto[];
}
