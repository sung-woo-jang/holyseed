import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { ModerationStatus } from '../../entities/wedding-media.entity';

export class ModerateMediaDto {
  @ApiProperty({ enum: [ModerationStatus.APPROVED, ModerationStatus.REJECTED], description: '검수 결과' })
  @IsEnum([ModerationStatus.APPROVED, ModerationStatus.REJECTED], {
    message: '검수 상태는 APPROVED 또는 REJECTED여야 합니다.',
  })
  moderationStatus: ModerationStatus.APPROVED | ModerationStatus.REJECTED;
}
