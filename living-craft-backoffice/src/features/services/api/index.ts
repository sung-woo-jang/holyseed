// ===== Query Hooks =====
export { useFetchServicesList } from './fetch-services-list'
export { useFetchServiceDetail } from './fetch-service-detail'
export { useFetchDistricts } from './fetch-districts'
export { useFetchIcons, useDebouncedIconsSearch } from './fetch-icons'

// ===== Mutation Hooks =====
export { useCreateService } from './create-service'
export { useUpdateService } from './update-service'
export { useDeleteService } from './delete-service'
export { useToggleService } from './toggle-service'
export { useUpdateServiceOrder } from './update-service-order'
export { useCreateIcon } from './fetch-icons/useCreateIcon'

// ===== Query Keys =====

// ===== Types =====
// fetch-services-list
export type {
  ServiceListItem,
  FetchServicesListResponse,
} from './fetch-services-list'

// fetch-service-detail
export type {
  ServiceDetail,
  ServiceRegionAdmin,
  ServiceScheduleAdmin,
  Icon,
  IconType,
  FetchServiceDetailResponse,
} from './fetch-service-detail'

// create-service
export type {
  CreateServiceRequest,
  ServiceRegionInput,
  ServiceScheduleInput,
  ScheduleMode,
  DayCode,
} from './create-service'

// update-service
export type {
  UpdateServiceRequest,
  UpdateServiceVariables,
} from './update-service'

// update-service-order
export type {
  UpdateServiceOrderRequest,
  ServiceOrderItem,
} from './update-service-order'

// fetch-districts
export type {
  District,
  DistrictLevel,
  FetchDistrictsParams,
  FetchDistrictsResponse,
} from './fetch-districts'

// fetch-icons
export type {
  IconItem,
  FetchIconsParams,
  FetchIconsResponse,
  CreateIconRequest,
  CreateIconResponse,
} from './fetch-icons'
