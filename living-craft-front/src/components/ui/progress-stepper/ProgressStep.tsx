import type { ReactNode } from 'react';

export interface ProgressStepProps {
  /**
   * 스텝 제목 (optional - compact variant에서는 필수, icon variant에서는 선택)
   */
  title?: string;

  /**
   * 스텝 아이콘 (icon variant에서 사용)
   * icon variant에서 각 스텝에 표시할 커스텀 아이콘
   */
  icon?: ReactNode;
}

/**
 * ProgressStepper의 개별 스텝 컴포넌트
 *
 * ProgressStepper의 children으로만 사용됩니다.
 * 이 컴포넌트는 실제로 렌더링되지 않고, ProgressStepper가 children의 props를 읽어서 사용합니다.
 *
 * @example
 * ```tsx
 * // Compact variant
 * <ProgressStepper variant="compact" activeStepIndex={1}>
 *   <ProgressStep title="서비스" />
 *   <ProgressStep title="날짜/시간" />
 *   <ProgressStep title="정보입력" />
 * </ProgressStepper>
 *
 * // Icon variant
 * <ProgressStepper variant="icon" activeStepIndex={1}>
 *   <ProgressStep title="서비스" icon={<ServiceIcon />} />
 *   <ProgressStep title="날짜/시간" icon={<CalendarIcon />} />
 * </ProgressStepper>
 * ```
 *
 * @see https://tossmini-docs.toss.im/tds-mobile/components/progress-stepper/
 */
// ProgressStep은 렌더링되지 않고 ProgressStepper가 props를 읽어서 사용합니다.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const ProgressStep = (_: ProgressStepProps) => {
  return null;
};
