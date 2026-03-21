import type { ImageState } from '@types';
import { createPhotoFormData } from '@utils/imageUtils';

import { axiosInstance } from '../axios';
import { API } from '../endpoints';

export interface UploadedPhoto {
  filename: string;
  path: string;
  url: string;
}

export interface UploadReservationPhotosResponse {
  photos: UploadedPhoto[];
}

/**
 * 예약용 사진 업로드 API
 * @param photos - ImageState 배열 (usePhotoManager에서 관리하는 사진 데이터)
 * @returns 업로드된 사진 URL 배열
 * @throws 업로드 실패 시 에러
 */
export async function uploadReservationPhotos(photos: ImageState[]): Promise<string[]> {
  if (!photos || photos.length === 0) {
    return [];
  }

  try {
    const formData = createPhotoFormData(photos);

    const response = await axiosInstance.post<UploadReservationPhotosResponse>(
      API.FILES.UPLOAD_RESERVATION_PHOTOS,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30초
      }
    );

    return response.data.data.photos.map((photo) => photo.url);
  } catch (error) {
    console.error('사진 업로드 실패:', error);
    throw new Error('사진 업로드에 실패했습니다. 다시 시도해주세요.');
  }
}
