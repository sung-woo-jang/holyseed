import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsOptional, IsString } from 'class-validator';

export class LinkProductDto {
  @ApiProperty({ description: '연결할 ProductListing ID (UUID)' })
  @IsUUID()
  productListingId: string;

  @ApiPropertyOptional({ description: '연결 메모' })
  @IsOptional()
  @IsString()
  note?: string;
}
