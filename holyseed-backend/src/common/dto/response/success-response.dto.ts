import { ApiProperty } from '@nestjs/swagger';

export class SuccessResponseDto<T = any> {
  @ApiProperty({ description: '성공 여부', example: true })
  success: boolean;

  @ApiProperty({ description: '메시지', example: '성공적으로 처리되었습니다.' })
  message: string;

  @ApiProperty({ description: '데이터' })
  data?: T;

  @ApiProperty({
    description: '타임스탬프',
    example: '2024-01-01T00:00:00.000Z',
  })
  timestamp: string;

  constructor(message: string, data?: T) {
    this.success = true;
    this.message = message;
    this.data = data;
    this.timestamp = new Date().toISOString();
  }
}
