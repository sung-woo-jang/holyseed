/**
 * 단계 상태
 */
export type StepStatus = 'locked' | 'active' | 'completed';

/**
 * 단계 키
 */
export type StepKey = 'service' | 'datetime' | 'customer' | 'confirmation';

/**
 * 각 단계의 상태
 */
export interface StepState {
  status: StepStatus;
  isExpanded: boolean;
}

/**
 * 전체 단계 상태
 */
export type AccordionStepsState = Record<StepKey, StepState>;

/**
 * 단계 순서
 */
export const STEP_ORDER: StepKey[] = ['service', 'datetime', 'customer', 'confirmation'];

/**
 * 단계 제목
 */
export const STEP_TITLES: Record<StepKey, string> = {
  service: '서비스 선택',
  datetime: '날짜/시간 선택',
  customer: '정보 입력',
  confirmation: '예약 확인',
};

/**
 * 초기 Accordion 상태
 */
export const initialAccordionSteps: AccordionStepsState = {
  service: { status: 'active', isExpanded: true },
  datetime: { status: 'locked', isExpanded: false },
  customer: { status: 'locked', isExpanded: false },
  confirmation: { status: 'locked', isExpanded: false },
};

/**
 * 다음 단계 가져오기
 */
export function getNextStep(currentStep: StepKey): StepKey | null {
  const currentIndex = STEP_ORDER.indexOf(currentStep);
  if (currentIndex === -1 || currentIndex === STEP_ORDER.length - 1) {
    return null;
  }
  return STEP_ORDER[currentIndex + 1] ?? null;
}

/**
 * 이전 단계 가져오기
 */
export function getPrevStep(currentStep: StepKey): StepKey | null {
  const currentIndex = STEP_ORDER.indexOf(currentStep);
  if (currentIndex <= 0) {
    return null;
  }
  return STEP_ORDER[currentIndex - 1] ?? null;
}

/**
 * 활성 단계 인덱스 가져오기
 */
export function getActiveStepIndex(steps: AccordionStepsState): number {
  for (let i = 0; i < STEP_ORDER.length; i++) {
    const stepKey = STEP_ORDER[i];
    if (stepKey && steps[stepKey]?.status === 'active') {
      return i;
    }
  }
  // 모든 단계가 완료된 경우 마지막 인덱스 반환
  return STEP_ORDER.length - 1;
}
