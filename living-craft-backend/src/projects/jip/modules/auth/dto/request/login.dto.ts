import { IsString, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class JipLoginDto {
  @ApiProperty({ description: '사용자명', example: 'admin' })
  @IsString()
  @MaxLength(50)
  @Transform(({ value }) => value?.trim())
  username: string;

  @ApiProperty({ description: '비밀번호', example: 'password123' })
  @IsString()
  @MinLength(4)
  password: string;
}
