import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateGuestbookDto {
  @ApiProperty({ description: '커플 ID (UUID)' })
  @IsUUID('4', { message: '유효한 커플 ID여야 합니다.' })
  coupleId: string;

  @ApiProperty({ description: '작성자 이름', example: '홍길동' })
  @IsString()
  @MaxLength(50)
  @Transform(({ value }) => value?.trim())
  guestName: string;

  @ApiProperty({ description: '방명록 메시지' })
  @IsString()
  @MaxLength(500)
  @Transform(({ value }) => value?.trim())
  message: string;
}
