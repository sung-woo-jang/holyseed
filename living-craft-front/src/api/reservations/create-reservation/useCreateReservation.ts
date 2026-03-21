/**
 * 예약 생성 Mutation 훅
 */

import type { SuccessResponse } from '@api';
import type { ImageState } from '@types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { showSuccessToast } from '@utils/toast';

import { generateQueryKeysFromUrl } from '../../../hooks/query-keys';
import { formInstance } from '../../axios';
import { API } from '../../endpoints';

/**
 * 백엔드 예약 생성 응답 DTO
 */
interface CreateReservationResponseDto {
  id: string;
  reservationNumber: string;
  status: string;
  createdAt: string;
}

/**
 * 예약 생성 요청 데이터 (React Native에서 사용)
 */
export interface CreateReservationWithPhotosRequest {
  serviceId: string;
  estimateDate: string;
  estimateTime: string;
  address: string;
  detailAddress: string;
  customerName: string;
  customerPhone: string;
  memo?: string;
  photos?: ImageState[]; // ImageState 배열로 변경
}

/**
 * 예약 생성 API 함수
 * 백엔드는 multipart/form-data로 파일을 직접 받습니다
 */
async function createReservation(
  data: CreateReservationWithPhotosRequest
): Promise<CreateReservationResponseDto> {
  const formData = new FormData();

  // 일반 필드 추가
  formData.append('serviceId', data.serviceId);
  formData.append('estimateDate', data.estimateDate);
  formData.append('estimateTime', data.estimateTime);
  formData.append('address', data.address);
  formData.append('detailAddress', data.detailAddress);
  formData.append('customerName', data.customerName);
  formData.append('customerPhone', data.customerPhone);

  if (data.memo) {
    formData.append('memo', data.memo);
  }

  // 파일 추가 (최대 5개) - React Native 방식
  if (data.photos && data.photos.length > 0) {
    data.photos.forEach((photo, index) => {
      formData.append('photos', {
        uri: photo.previewUri,
        type: 'image/jpeg',
        name: `photo_${index}.jpg`,
      } as any);
    });
  }

  const { data: axiosData } = await formInstance.post(API.RESERVATIONS.CREATE, formData);
  const response = axiosData as SuccessResponse<CreateReservationResponseDto>;

  return response.data;
}

/**
 * 예약 생성 훅
 */
export function useCreateReservation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createReservation,
    onSuccess: () => {
      // 예약 목록 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: generateQueryKeysFromUrl(API.USERS.MY_RESERVATIONS),
      });
      showSuccessToast('예약이 완료되었습니다.');
    },
  });
}
