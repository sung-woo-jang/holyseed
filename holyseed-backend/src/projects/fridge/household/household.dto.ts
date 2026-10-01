import { IsIn, IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';
import { Transform } from 'class-transformer';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class CreateHouseholdDto {
  @IsString({ message: '가구 이름은 문자열이어야 합니다.' })
  @Transform(trim)
  @Length(1, 50, { message: '가구 이름은 1~50자여야 합니다.' })
  name: string;
}

export class JoinHouseholdDto {
  @IsString({ message: '초대 코드를 입력해 주세요.' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  @Length(4, 16, { message: '초대 코드 형식이 올바르지 않습니다.' })
  code: string;
}

export class UpdateHouseholdDto {
  @IsOptional()
  @IsString()
  @Transform(trim)
  @Length(1, 50)
  name?: string;

  @IsOptional()
  @IsIn(['auto', 'off'], { message: '야간모드 값이 올바르지 않습니다.' })
  nightMode?: 'auto' | 'off';

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(60)
  defaultDays?: number;
}
