import { ApiProperty } from '@nestjs/swagger';

export class SuccessBaseResponseDto<T> {
  @ApiProperty({
    description: '성공 여부',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: '응답 메시지',
    example: '성공적으로 처리되었습니다.',
  })
  message: string;

  @ApiProperty({
    description: '응답 데이터',
  })
  data: T;

  constructor(message: string, data: T) {
    this.success = true;
    this.message = message;
    this.data = data;
  }
}

export class PaginationMetaDto {
  @ApiProperty({
    description: '현재 페이지',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: '페이지당 아이템 수',
    example: 10,
  })
  limit: number;

  @ApiProperty({
    description: '총 아이템 수',
    example: 100,
  })
  total: number;

  @ApiProperty({
    description: '총 페이지 수',
    example: 10,
  })
  totalPages: number;

  @ApiProperty({
    description: '다음 페이지 존재 여부',
    example: true,
  })
  hasNext: boolean;

  @ApiProperty({
    description: '이전 페이지 존재 여부',
    example: false,
  })
  hasPrev: boolean;

  constructor(page: number, limit: number, total: number) {
    this.page = page;
    this.limit = limit;
    this.total = total;
    this.totalPages = Math.ceil(total / limit);
    this.hasNext = page < this.totalPages;
    this.hasPrev = page > 1;
  }
}

export class PaginatedResponseDto<T> extends SuccessBaseResponseDto<T[]> {
  @ApiProperty({
    description: '페이지네이션 메타데이터',
  })
  meta: PaginationMetaDto;

  constructor(message: string, data: T[], meta: PaginationMetaDto) {
    super(message, data);
    this.meta = meta;
  }
}

// Swagger에서 사용할 스키마
export const SuccessBaseResponseSchema = SuccessBaseResponseDto;
