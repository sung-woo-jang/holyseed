/**
 * API 모듈 통합 export
 */

// ===== Core =====
export type {
  ApiResponse,
  BackendPaginationParams,
  ErrorResponse,
  PaginatedResponse,
  PaginationMeta,
  PaginationParams,
} from './apiResponseTypes';
export { convertPageToOffset } from './apiResponseTypes';
export { axiosInstance, ContentType, formInstance } from './axios';
export type { TypedAxiosInstance } from './axios-types';
export { API, AUTH_API } from './endpoints';

// ===== Domain Types =====
export type * from './types';

// ===== Domain APIs =====
// Auth
export {
  useCurrentUser,
  useIsAuthenticated,
  useLogin,
  useLogout,
  useRefreshToken,
} from './auth';

// Services
export { checkEstimateFeeByRegion, getServiceableRegionsForService } from './serviceableRegions';
export { getServices, useAvailableDates, useAvailableTimes, useServices } from './services';

// Reservations
export {
  useCancelReservation,
  useCreateReservation,
  useMyReservations,
  useReservation,
} from './reservations';

// Portfolios
export { usePortfolio, usePortfolios } from './portfolios';

// Reviews
export { useCreateReview, useReviews } from './reviews';

// Promotions
export { useIncrementPromotionClick, usePromotions } from './promotions';

// Users
export { useMe, useMyReviews } from './users';

// Files
export type { UploadedPhoto, UploadReservationPhotosResponse } from './files';
export {
  uploadReservationPhotos,
  useUploadReservationImages,
  useUploadReviewImages,
} from './files';

// Address Search
export { searchAddress } from './kakaoLocalSearch';
