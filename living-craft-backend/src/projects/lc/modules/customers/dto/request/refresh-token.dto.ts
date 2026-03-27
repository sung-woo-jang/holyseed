import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ERROR_MESSAGES } from '@common/constants';

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh Token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString({
    message: ERROR_MESSAGES.VALIDATION.IS_STRING('리프레시 토큰'),
  })
  @IsNotEmpty({
    message: ERROR_MESSAGES.VALIDATION.IS_NOT_EMPTY('리프레시 토큰'),
  })
  refreshToken: string;
}
