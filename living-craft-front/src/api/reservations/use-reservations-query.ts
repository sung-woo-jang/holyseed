/**
 * 예약 관련 Query 훅
 */

import { generateQueryKeysFromUrl } from '@hooks/query-keys';
import { useQuery } from '@tanstack/react-query';

import { axiosInstance } from '../axios';
import { API } from '../endpoints';
import type { Reservation, ReservationListParams, SuccessResponse } from '../types';

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
 * 백엔드 내 예약 목록 아이템 DTO
 */
interface MyReservationListItemDto {
  id: string;
  reservationNumber: string;
  service: {
    id: string;
    title: string;
  };
  estimateDate: string;
  status: string;
  createdAt: string;
}

/**
 * 백엔드 내 예약 목록 응답 DTO
 */
interface MyReservationListResponseDto {
  items: MyReservationListItemDto[];
  total: number;
}

/**
 * 백엔드 DTO를 프론트엔드 타입으로 변환
 */
function mapReservationDetailDtoToReservation(dto: ReservationDetailDto): Reservation {
  return {
    id: Number(dto.id),
    reservationNumber: dto.reservationNumber,
    customer: null as any, // 상세 조회에서는 customer 정보 불필요
    customerId: 0, // 상세 조회에서는 customerId 불필요
    service: {
      id: Number(dto.service.id),
      title: dto.service.title,
    } as any,
    serviceId: Number(dto.service.id),
    estimateDate: dto.estimateDate,
    estimateTime: dto.estimateTime,
    constructionDate: dto.constructionDate,
    constructionTime: dto.constructionTime,
    address: dto.address,
    detailAddress: dto.detailAddress,
    customerName: dto.customerName,
    customerPhone: dto.customerPhone,
    memo: null,
    photos: null,
    status: dto.status as any,
    cancelledAt: null,
    createdAt: dto.createdAt,
    updatedAt: dto.createdAt,
    hasReview: !dto.canReview, // canReview가 false면 이미 리뷰 작성함
  };
}

/**
 * 예약 상세 조회 훅
 */
export function useReservation(id: number, enabled: boolean = true) {
  return useQuery({
    queryKey: ['reservation', id],
    queryFn: async () => {
      const { data } = await axiosInstance.get(API.RESERVATIONS.DETAIL(id));
      const responseData = data as SuccessResponse<ReservationDetailDto>;
      return mapReservationDetailDtoToReservation(responseData.data);
    },
    enabled: enabled && !!id,
  });
}

/**
 * 내 예약 목록 조회 훅
 */
export function useMyReservations(params?: ReservationListParams) {
  return useQuery({
    queryKey: [...generateQueryKeysFromUrl(API.USERS.MY_RESERVATIONS), params],
    queryFn: async () => {
      const { data } = await axiosInstance.get(API.USERS.MY_RESERVATIONS, { params });
      const responseData = data as SuccessResponse<MyReservationListResponseDto>;
      const { items, total } = responseData.data;

      // 간단한 목록 아이템을 Reservation 타입으로 변환
      const reservations: Reservation[] = items.map((item: MyReservationListItemDto) => ({
        id: Number(item.id),
        reservationNumber: item.reservationNumber,
        customer: null as any,
        customerId: 0,
        service: {
          id: Number(item.service.id),
          title: item.service.title,
        } as any,
        serviceId: Number(item.service.id),
        estimateDate: item.estimateDate,
        estimateTime: '',
        constructionDate: '',
        constructionTime: null,
        address: '',
        detailAddress: '',
        customerName: '',
        customerPhone: '',
        memo: null,
        photos: null,
        status: item.status as any,
        cancelledAt: null,
        createdAt: item.createdAt,
        updatedAt: item.createdAt,
      }));

      return {
        data: reservations,
        total,
      };
    },
  });
}
