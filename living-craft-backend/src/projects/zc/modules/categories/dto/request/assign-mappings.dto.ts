import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID } from 'class-validator';

export class AssignMappingsDto {
  @ApiProperty({ description: '매핑할 SiteCategory ID 배열', type: [String] })
  @IsArray()
  @IsUUID('all', { each: true })
  siteCategoryIds: string[];
}
