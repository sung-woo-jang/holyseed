import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString } from 'class-validator';

export class AppLoginDto {
  @ApiProperty({ description: '토스 appLogin 인증 코드' })
  @IsString()
  authorizationCode: string;

  @ApiProperty({ description: '호출 환경', enum: ['DEFAULT', 'SANDBOX'] })
  @IsIn(['DEFAULT', 'SANDBOX'])
  referrer: 'DEFAULT' | 'SANDBOX';
}
