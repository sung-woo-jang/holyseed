/**
 * Mock 데이터 정의
 * 개발 환경에서 사용할 Mock 데이터를 정의합니다.
 */

import type {
  Icon,
  LoginResponse,
  RefreshTokenResponse,
  Reservation,
  Review,
  Service,
  User,
} from '@api/types';
import { ReservationStatus } from '@api/types';

/**
 * Mock 딜레이 (실제 API처럼 약간의 지연 시뮬레이션)
 */
export const mockDelay = (ms: number = 500): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

/**
 * Mock 아이콘 데이터
 */
const MOCK_ICON: Icon = {
  id: 1,
  name: 'fill-film',
  type: 'FILL',
};

/**
 * Mock 서비스 데이터
 */
const MOCK_SERVICE: Service = {
  id: 1,
  title: '인테리어 필름',
  description: '인테리어 필름 시공 서비스',
  icon: MOCK_ICON,
  iconBgColor: '#E3F2FD',
  duration: '2-3시간',
  requiresTimeSelection: true,
};

/**
 * Mock 사용자 데이터
 */
export const MOCK_USER: User = {
  id: 1,
  uuid: 'mock-user-uuid-12345',
  name: '테스트 사용자',
  phone: '010-1234-5678',
  email: 'test@example.com',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

/**
 * Mock 로그인 응답
 */
export const MOCK_LOGIN_RESPONSE: LoginResponse = {
  accessToken: 'mock-access-token-' + Date.now(),
  refreshToken: 'mock-refresh-token-' + Date.now(),
  user: MOCK_USER,
};

/**
 * Mock 토큰 갱신 응답
 */
export const MOCK_REFRESH_RESPONSE: RefreshTokenResponse = {
  accessToken: 'mock-access-token-refreshed-' + Date.now(),
  refreshToken: 'mock-refresh-token-refreshed-' + Date.now(),
};

/**
 * Mock 예약 데이터
 */
export const MOCK_RESERVATIONS: Reservation[] = [
  {
    id: 1,
    reservationNumber: 'RES-2024-001',
    customer: MOCK_USER,
    customerId: 1,
    service: MOCK_SERVICE,
    serviceId: 1,
    estimateDate: '2024-01-20',
    estimateTime: '14:00',
    constructionDate: '2024-01-25',
    constructionTime: '10:00',
    address: '서울시 강남구 테헤란로 123',
    detailAddress: '456호',
    customerName: '테스트 사용자',
    customerPhone: '010-1234-5678',
    memo: '주차 가능합니다',
    photos: [],
    status: ReservationStatus.PENDING,
    cancelledAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    hasReview: true,
  },
];

/**
 * Mock 리뷰 데이터
 */
export const MOCK_REVIEWS: Review[] = [
  {
    id: 1,
    reservation: MOCK_RESERVATIONS[0]!,
    reservationId: 1,
    customer: MOCK_USER,
    customerId: 1,
    service: MOCK_SERVICE,
    serviceId: 1,
    rating: 5,
    comment: '정말 만족스러운 시공이었습니다!',
    images: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];
