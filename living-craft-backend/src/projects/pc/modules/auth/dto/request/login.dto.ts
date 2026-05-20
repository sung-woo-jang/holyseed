import { IsString, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class PcLoginDto {
  @ApiProperty({ description: '사용자명', example: 'admin' })
  @IsString({ message: '사용자명은 문자열이어야 합니다.' })
  @MaxLength(50, { message: '사용자명은 50자를 초과할 수 없습니다.' })
  @Transform(({ value }) => value?.trim())
  username: string;

  @ApiProperty({ description: '비밀번호', example: 'password123' })
  @IsString({ message: '비밀번호는 문자열이어야 합니다.' })
  @MinLength(4, { message: '비밀번호는 4자 이상이어야 합니다.' })
  password: string;
}
