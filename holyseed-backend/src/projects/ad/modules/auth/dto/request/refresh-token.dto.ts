import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({ description: '갱신 토큰' })
  @IsString()
  refreshToken: string;
}
