import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { MemberRole } from '../../../memberships/entities/membership.entity';

export class CreateInvitationDto {
  @ApiPropertyOptional({ enum: [MemberRole.EDITOR, MemberRole.VIEWER], default: MemberRole.EDITOR })
  @IsOptional()
  @IsEnum([MemberRole.EDITOR, MemberRole.VIEWER])
  role?: MemberRole.EDITOR | MemberRole.VIEWER;
}
