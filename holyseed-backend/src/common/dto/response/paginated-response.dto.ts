import { ApiProperty } from '@nestjs/swagger';

export class PaginationMetaDto {
  @ApiProperty({ description: '현재 페이지', example: 1 })
  currentPage: number;

  @ApiProperty({ description: '페이지당 항목 수', example: 10 })
  itemsPerPage: number;

  @ApiProperty({ description: '총 항목 수', example: 100 })
  totalItems: number;

  @ApiProperty({ description: '총 페이지 수', example: 10 })
  totalPages: number;

  @ApiProperty({ description: '다음 페이지 존재 여부', example: true })
  hasNextPage: boolean;

  @ApiProperty({ description: '이전 페이지 존재 여부', example: false })
  hasPreviousPage: boolean;

  constructor(currentPage: number, itemsPerPage: number, totalItems: number) {
    this.currentPage = currentPage;
    this.itemsPerPage = itemsPerPage;
    this.totalItems = totalItems;
    this.totalPages = Math.ceil(totalItems / itemsPerPage);
    this.hasNextPage = currentPage < this.totalPages;
    this.hasPreviousPage = currentPage > 1;
  }
}

export class PaginatedResponseDto<T> {
  @ApiProperty({ description: '성공 여부', example: true })
  success: boolean;

  @ApiProperty({
    description: '메시지',
    example: '데이터를 성공적으로 조회했습니다.',
  })
  message: string;

  @ApiProperty({ description: '데이터 배열' })
  data: T[];

  @ApiProperty({
    description: '페이지네이션 메타 정보',
    type: PaginationMetaDto,
  })
  meta: PaginationMetaDto;

  @ApiProperty({
    description: '타임스탬프',
    example: '2024-01-01T00:00:00.000Z',
  })
  timestamp: string;

  constructor(
    data: T[],
    currentPage: number,
    itemsPerPage: number,
    totalItems: number,
    message: string = '데이터를 성공적으로 조회했습니다.',
  ) {
    this.success = true;
    this.message = message;
    this.data = data;
    this.meta = new PaginationMetaDto(currentPage, itemsPerPage, totalItems);
    this.timestamp = new Date().toISOString();
  }
}
