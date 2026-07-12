import { ApiProperty } from '@nestjs/swagger';

export class AddressItemDto {
  @ApiProperty({ description: '도로명 주소' })
  roadAddress: string;

  @ApiProperty({ description: '지번 주소' })
  jibunAddress: string;

  @ApiProperty({ description: '우편번호 (빈 문자열)' })
  zipCode: string;
}

export class AddressSearchResponseDto {
  @ApiProperty({ description: '검색된 주소 목록', type: [AddressItemDto] })
  addresses: AddressItemDto[];

  @ApiProperty({ description: '검색 결과 개수' })
  count: number;
}
