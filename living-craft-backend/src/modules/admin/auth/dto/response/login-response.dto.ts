import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from '@modules/admin/users/dto/response/user-response.dto';

export class LoginResponseDto {
  @ApiProperty({ description: 'JWT 액세스 토큰' })
  accessToken: string;

  @ApiProperty({ description: '사용자 정보', type: UserResponseDto })
  user: UserResponseDto;
}
