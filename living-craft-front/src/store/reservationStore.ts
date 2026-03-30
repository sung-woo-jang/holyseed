import { getNextStep, initialAccordionSteps, STEP_ORDER } from '@components/ui/accordion-step';
import { StoreWithShallow, useStoreWithShallow } from '@types';
import { immer } from 'zustand/middleware/immer';
import { createWithEqualityFn } from 'zustand/traditional';

import type { ReservationState, ReservationStore } from '../types/reservationStore';

const initialState: ReservationState = {
  isLoading: false,
  isEstimateCalendarVisible: false,
  addressSearchQuery: '',
  addressSearchResults: [],
  isAddressSearching: false,
  showAddressDetailInput: false,
  selectedAddress: null,
  isAddressSearchDrawerOpen: false,
  accordionSteps: initialAccordionSteps,
};

const reservationStore = createWithEqualityFn(
  immer<ReservationStore>((set) => ({
    ...initialState,

    // 단순 상태 업데이트 통합 함수
    update: (updates) => {
      set((state) => Object.assign(state, updates));
    },

    // 주소 검색 액션
    selectAddress: (address) =>
      set((state) => {
        state.selectedAddress = address;
        state.showAddressDetailInput = true;
      }),

    resetAddressSearch: () =>
      set((state) => {
        state.addressSearchQuery = '';
        state.addressSearchResults = [];
        state.isAddressSearching = false;
        state.showAddressDetailInput = false;
        state.selectedAddress = null;
        state.isAddressSearchDrawerOpen = false;
      }),

    // Accordion 액션 (통합 예약 페이지용)
    setStepStatus: (step, status) =>
      set((state) => {
        const currentStep = state.accordionSteps[step];
        if (currentStep) {
          currentStep.status = status;
        }
      }),

    setStepExpanded: (step, isExpanded) =>
      set((state) => {
        const currentStep = state.accordionSteps[step];
        if (currentStep) {
          currentStep.isExpanded = isExpanded;
        }
      }),

    toggleStepExpanded: (step) =>
      set((state) => {
        const currentStep = state.accordionSteps[step];
        if (currentStep && currentStep.status !== 'locked') {
          currentStep.isExpanded = !currentStep.isExpanded;
        }
      }),

    completeStep: (step) =>
      set((state) => {
        const nextStep = getNextStep(step);

        // 현재 단계 완료 처리
        const currentStepState = state.accordionSteps[step];
        if (currentStepState) {
          currentStepState.status = 'completed';
          currentStepState.isExpanded = false;
        }

        // 다음 단계 활성화
        if (nextStep) {
          const nextStepState = state.accordionSteps[nextStep];
          if (nextStepState) {
            nextStepState.status = 'active';
            nextStepState.isExpanded = true;
          }
        }
      }),

    goToStep: (step) =>
      set((state) => {
        const stepIndex = STEP_ORDER.indexOf(step);

        STEP_ORDER.forEach((s, index) => {
          const stepState = state.accordionSteps[s];
          if (!stepState) return;

          if (index < stepIndex) {
            stepState.status = 'completed';
            stepState.isExpanded = false;
          } else if (index === stepIndex) {
            stepState.status = 'active';
            stepState.isExpanded = true;
          } else {
            stepState.status = 'locked';
            stepState.isExpanded = false;
          }
        });
      }),

    resetAccordionSteps: () =>
      set((state) => {
        state.accordionSteps = initialAccordionSteps;
      }),

    // 리셋
    reset: () =>
      set((state) => {
        Object.assign(state, initialState);
      }),
  }))
);

/**
 * 예약 UI 상태를 선택적으로 구독하는 훅
 * @example
 * const { formData, isLoading } = useReservationStore(['formData', 'isLoading']);
 */
export const useReservationStore: StoreWithShallow<ReservationStore> = (keys, withEqualityFn = true) =>
  useStoreWithShallow(reservationStore, keys, withEqualityFn);

/**
 * 예약 스토어 (subscribe 패턴용)
 * @example
 * const unsubscribe = reservationStoreApi.subscribe((state) => { ... });
 */
export { reservationStore as reservationStoreApi };
