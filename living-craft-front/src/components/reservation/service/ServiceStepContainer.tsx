import { AccordionStep } from '@components/ui/accordion-step';
import { useScrollContext } from '@contexts';
import { useReservationValidation, useServices } from '@hooks';
import { useReservationStore } from '@store';
import type { ReservationFormData } from '@types';
import { safeLayoutAnimation, scheduleScrollToStep } from '@utils';
import { useFormContext } from 'react-hook-form';
import { View } from 'react-native';

import { AddressManagementSection } from './AddressManagementSection';
import { ServiceSelector } from './ServiceSelector';
import { ServiceSummary } from './ServiceSummary';

/**
 * 서비스 선택 단계 컨테이너
 *
 * 변경 사항 (Phase 3):
 * - serviceIdParam 제거 (URL 파라미터로 서비스 자동 선택하지 않음)
 * - ServiceSelectionStep → ServiceSelector로 교체
 * - 지역 선택 UI 완전 제거 (주소 검색만 사용)
 * - 서비스 변경 시 주소 초기화 로직 제거
 */
export function ServiceStepContainer() {
  // ===== Context =====
  const { scrollViewRef, stepRefs } = useScrollContext();

  // ===== Store =====
  const { accordionSteps, toggleStepExpanded, completeStep, goToStep } = useReservationStore([
    'accordionSteps',
    'toggleStepExpanded',
    'completeStep',
    'goToStep',
  ]);

  // ===== Form =====
  const { setValue, watch } = useFormContext<ReservationFormData>();
  const { canProceedToNext } = useReservationValidation();

  // ===== Data Fetching =====
  const { data: services, isLoading } = useServices();

  // ===== Computed =====
  const currentService = watch('service');
  const currentAddress = watch('customerInfo.address');
  const hasAddress = Boolean(currentAddress?.trim());
  const canProceed = canProceedToNext('service') && hasAddress;

  // ===== 핸들러 =====
  const handleServiceChange = (serviceId: number) => {
    const service = services?.find((s) => s.id === serviceId);
    setValue('service', service || null);
  };

  const handleToggle = () => {
    safeLayoutAnimation();
    toggleStepExpanded('service');
  };

  const handleComplete = () => {
    safeLayoutAnimation();
    completeStep('service');

    // 자동 스크롤
    scheduleScrollToStep(scrollViewRef, stepRefs.current.datetime);
  };

  const handleEdit = () => {
    safeLayoutAnimation();
    goToStep('service');
    scheduleScrollToStep(scrollViewRef, stepRefs.current.service);
  };

  const accordionStep = accordionSteps.service!;

  return (
    <View
      ref={(ref) => {
        // eslint-disable-next-line react-hooks/immutability
        stepRefs.current.service = ref;
      }}
    >
      <AccordionStep
        stepKey="service"
        stepNumber={1}
        title="서비스 선택"
        status={accordionStep.status}
        isExpanded={accordionStep.isExpanded}
        summaryContent={<ServiceSummary />}
        onToggle={accordionStep.status === 'completed' ? handleEdit : handleToggle}
        onComplete={handleComplete}
        isCompleteDisabled={!canProceed || !hasAddress}
        hideCompleteButton={false}
      >
        <ServiceSelector
          services={services}
          value={currentService?.id}
          onChange={handleServiceChange}
          isLoading={isLoading}
        />
        <AddressManagementSection />
      </AccordionStep>
    </View>
  );
}
