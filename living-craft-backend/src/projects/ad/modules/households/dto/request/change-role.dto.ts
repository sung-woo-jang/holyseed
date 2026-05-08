import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { MemberRole } from '../../../memberships/entities/membership.entity';

export class ChangeRoleDto {
  @ApiProperty({ enum: [MemberRole.EDITOR, MemberRole.VIEWER] })
  @IsEnum([MemberRole.EDITOR, MemberRole.VIEWER])
  role: MemberRole.EDITOR | MemberRole.VIEWER;
}
