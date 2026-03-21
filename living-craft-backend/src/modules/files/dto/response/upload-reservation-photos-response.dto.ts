import { ApiProperty } from '@nestjs/swagger';

export class UploadedPhotoDto {
  @ApiProperty({
    description: '원본 파일명 (WebP 확장자)',
    example: 'photo_1234567890.webp',
  })
  filename: string;

  @ApiProperty({
    description: 'NCP Object Storage S3 키',
    example: 'reservations/photo_1234567890.webp',
  })
  path: string;

  @ApiProperty({
    description: '공개 URL',
    example:
      'https://kr.object.ncloudstorage.com/living-craft/reservations/photo_1234567890.webp',
  })
  url: string;
}

export class UploadReservationPhotosResponseDto {
  @ApiProperty({
    description: '업로드된 사진 정보 배열',
    type: [UploadedPhotoDto],
  })
  photos: UploadedPhotoDto[];
}
