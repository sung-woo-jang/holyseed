/**
 * 이미지 업로드 Mutation 훅
 */

import type { MultipleImageUploadResponse } from '@api';
import { useMutation } from '@tanstack/react-query';

import { formInstance } from '../../axios';
import { API } from '../../endpoints';

interface UploadImagesParams {
  files: File[];
  type: 'review' | 'reservation';
}

/**
 * 이미지 업로드 API 함수
 */
async function uploadImages(params: UploadImagesParams): Promise<MultipleImageUploadResponse> {
  const { files, type } = params;
  const formData = new FormData();

  files.forEach((file) => {
    formData.append('files', file);
  });

  const endpoint =
    type === 'review'
      ? API.FILES.UPLOAD_REVIEW_IMAGES
      : API.FILES.UPLOAD_RESERVATION_PHOTOS;

  const { data } = await formInstance.post<MultipleImageUploadResponse>(endpoint, formData);
  return data.data;
}

/**
 * 리뷰 이미지 업로드 훅
 */
export function useUploadReviewImages() {
  return useMutation({
    mutationFn: (files: File[]) => uploadImages({ files, type: 'review' }),
  });
}

/**
 * 예약 이미지 업로드 훅
 */
export function useUploadReservationImages() {
  return useMutation({
    mutationFn: (files: File[]) => uploadImages({ files, type: 'reservation' }),
  });
}
