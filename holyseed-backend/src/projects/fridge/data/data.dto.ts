import { PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Length, Matches, Max, Min } from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
const PLACES = ['냉장', '냉동', '실온'];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export class CreatePersonDto {
  @IsString()
  @Transform(trim)
  @Length(1, 30, { message: '이름은 1~30자여야 합니다.' })
  name: string;

  @IsString()
  @Length(1, 40)
  color: string;
}
export class UpdatePersonDto extends PartialType(CreatePersonDto) {}

export class CreateFreqDto {
  @IsString()
  @Transform(trim)
  @Length(1, 50, { message: '품목 이름은 1~50자여야 합니다.' })
  name: string;

  @IsIn(PLACES, { message: '보관 위치는 냉장/냉동/실온 중 하나여야 합니다.' })
  place: '냉장' | '냉동' | '실온';

  @IsInt()
  @Min(1)
  @Max(3650)
  days: number;
}
export class UpdateFreqDto extends PartialType(CreateFreqDto) {}

export class CreateIngredientDto {
  @IsString()
  @Transform(trim)
  @Length(1, 50, { message: '재료 이름은 1~50자여야 합니다.' })
  name: string;

  @IsIn(PLACES, { message: '보관 위치는 냉장/냉동/실온 중 하나여야 합니다.' })
  place: '냉장' | '냉동' | '실온';

  @Matches(DATE_RE, { message: '유통기한은 YYYY-MM-DD 형식이어야 합니다.' })
  exp: string;
}
export class UpdateIngredientDto extends PartialType(CreateIngredientDto) {}

export class CreateShopDto {
  @IsString()
  @Transform(trim)
  @Length(1, 50, { message: '품목 이름은 1~50자여야 합니다.' })
  name: string;

  @IsOptional()
  @IsBoolean()
  done?: boolean;
}
export class UpdateShopDto extends PartialType(CreateShopDto) {}

export class CreateEventDto {
  @Matches(DATE_RE, { message: '날짜는 YYYY-MM-DD 형식이어야 합니다.' })
  date: string;

  @IsString()
  @Matches(/^(([01]\d|2[0-3]):[0-5]\d)?$/, { message: '시간은 HH:mm 형식이거나 비워야 합니다.' })
  time: string;

  @IsString()
  @Transform(trim)
  @Length(1, 100, { message: '일정 제목은 1~100자여야 합니다.' })
  title: string;

  @IsOptional()
  @IsInt()
  personId?: number | null;

  @IsIn(['none', 'weekly'])
  repeat: 'none' | 'weekly';
}
export class UpdateEventDto extends PartialType(CreateEventDto) {}
