/**
 * 예약 취소 Mutation 훅
 */

import type { SuccessResponse } from '@api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { showSuccessToast } from '@utils/toast';

import { generateQueryKeysFromUrl } from '../../../hooks/query-keys';
import { axiosInstance } from '../../axios';
import { API } from '../../endpoints';

/**
 * 백엔드 예약 상세 응답 DTO
 */
interface ReservationDetailDto {
  id: string;
  reservationNumber: string;
  service: {
    id: string;
    title: string;
  };
  estimateDate: string;
  estimateTime: string;
  constructionDate: string;
  constructionTime: string | null;
  address: string;
  detailAddress: string;
  customerName: string;
  customerPhone: string;
  status: string;
  canCancel: boolean;
  canReview: boolean;
  createdAt: string;
}

/**
 * 예약 취소 API 함수
 */
async function cancelReservation(id: number): Promise<ReservationDetailDto> {
  const { data } = await axiosInstance.post(API.RESERVATIONS.CANCEL(id));
  const response = data as SuccessResponse<ReservationDetailDto>;
  return response.data;
}

/**
 * 예약 취소 훅
 */
export function useCancelReservation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelReservation,
    onSuccess: (_data, reservationId) => {
      // 예약 목록 및 상세 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: generateQueryKeysFromUrl(API.USERS.MY_RESERVATIONS),
      });
      queryClient.invalidateQueries({
        queryKey: ['reservation', reservationId],
      });
      showSuccessToast('예약이 취소되었습니다.');
    },
  });
}
