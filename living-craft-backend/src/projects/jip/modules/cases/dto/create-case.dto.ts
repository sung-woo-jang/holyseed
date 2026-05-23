import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CasePhotoDto {
  @ApiProperty({ enum: ['cover', 'before', 'after'] })
  role: 'cover' | 'before' | 'after';

  @ApiPropertyOptional()
  label?: string;

  @ApiProperty()
  fileUrl: string;
}

export class CreateCaseDto {
  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  area?: string;

  @ApiPropertyOptional()
  hours?: number;

  @ApiPropertyOptional({ description: 'YYYY.MM 형식' })
  dateText?: string;

  @ApiPropertyOptional({ enum: ['warm', 'cool', 'default'] })
  color?: string;

  @ApiPropertyOptional()
  intro?: string;

  @ApiPropertyOptional()
  story?: string;

  @ApiPropertyOptional()
  isPublished?: boolean;

  @ApiPropertyOptional({ type: [String] })
  tags?: string[];

  @ApiPropertyOptional({ type: [CasePhotoDto] })
  photos?: CasePhotoDto[];
}
