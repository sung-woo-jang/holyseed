// ===== Utility Hooks =====
export { useBoolean } from './useBoolean';
export { useBottomNavHeight } from './useBottomNavHeight';
export { usePermissionGate } from './usePermissionGate';
export type { ImageState } from './usePhotoManager';
export { usePhotoManager } from './usePhotoManager';

// ===== Query Utilities =====
export { useStandardMutation, useStandardQuery } from './custom-query';
export { generateQueryKeysFromUrl } from './query-keys';
export { useRefresh } from './useRefresh';

// ===== Reservation Hooks =====
export { useReservationForm } from './useReservationForm';
export { useReservationValidation } from './useReservationValidation';

// ===== API Hooks (re-export from @api for backwards compatibility) =====
// NOTE: 새 코드에서는 @api에서 직접 import하는 것을 권장합니다.
export {
  useAvailableDates,
  useAvailableTimes,
  useCancelReservation,
  useCreateReservation,
  useCreateReview,
  useCurrentUser,
  useIncrementPromotionClick,
  useIsAuthenticated,
  // Auth
  useLogin,
  useLogout,
  // Users
  useMe,
  useMyReservations,
  useMyReviews,
  usePortfolio,
  // Portfolios
  usePortfolios,
  // Promotions
  usePromotions,
  useRefreshToken,
  // Reservations
  useReservation,
  // Reviews
  useReviews,
  // Services
  useServices,
  useUploadReservationImages,
  // Files
  useUploadReviewImages,
} from '../api';
