import { AccordionStepsState, StepKey, StepStatus } from '@components/ui/accordion-step';

import { AddressSearchResult } from './reservation';

/**
 * 예약 UI 상태
 * Note: 폼 데이터는 React Hook Form으로 관리하고, 여기서는 UI 상태만 관리
 */
export interface ReservationState {
  // UI 상태
  isLoading: boolean;
  // 견적 캘린더
  isEstimateCalendarVisible: boolean;

  // 주소 검색 상태
  addressSearchQuery: string;
  addressSearchResults: AddressSearchResult[];
  isAddressSearching: boolean;
  showAddressDetailInput: boolean;
  selectedAddress: AddressSearchResult | null;
  isAddressSearchDrawerOpen: boolean;

  // Accordion 상태 (통합 예약 페이지용)
  accordionSteps: AccordionStepsState;
}

/**
 * 예약 UI 액션
 */
export interface ReservationActions {
  // 단순 상태 업데이트 통합 함수
  update: (updates: Partial<ReservationState>) => void;

  // 주소 검색 상태
  selectAddress: (address: AddressSearchResult) => void;
  resetAddressSearch: () => void;

  // Accordion 액션 (통합 예약 페이지용)
  setStepStatus: (step: StepKey, status: StepStatus) => void;
  setStepExpanded: (step: StepKey, isExpanded: boolean) => void;
  toggleStepExpanded: (step: StepKey) => void;
  completeStep: (step: StepKey) => void;
  goToStep: (step: StepKey) => void;
  resetAccordionSteps: () => void;

  // 리셋
  reset: () => void;
}

/**
 * 예약 스토어 타입
 */
export type ReservationStore = ReservationState & ReservationActions;
