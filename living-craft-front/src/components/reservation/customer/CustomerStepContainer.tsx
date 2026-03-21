import { AccordionStep } from '@components/ui/accordion-step';
import { useScrollContext } from '@contexts';
import { useReservationValidation } from '@hooks';
import { useReservationStore } from '@store';
import { safeLayoutAnimation, scheduleScrollToStep } from '@utils';
import { View } from 'react-native';

import { CustomerInfoStep } from './CustomerInfoStep';
import { CustomerSummary } from './CustomerSummary';

export function CustomerStepContainer() {
  // ===== Context =====
  const { scrollViewRef, stepRefs } = useScrollContext();

  // ===== Store =====
  const { accordionSteps, toggleStepExpanded, completeStep, goToStep } = useReservationStore([
    'accordionSteps',
    'toggleStepExpanded',
    'completeStep',
    'goToStep',
  ]);

  // ===== Validation =====
  const { canProceedToNext } = useReservationValidation();
  const canProceed = canProceedToNext('customer');

  // ===== 핸들러 =====
  const handleToggle = () => {
    safeLayoutAnimation();
    toggleStepExpanded('customer');
  };

  const handleComplete = () => {
    safeLayoutAnimation();
    completeStep('customer');

    // 자동 스크롤
    scheduleScrollToStep(scrollViewRef, stepRefs.current.confirmation);
  };

  const handleEdit = () => {
    safeLayoutAnimation();
    goToStep('customer');
    scheduleScrollToStep(scrollViewRef, stepRefs.current.customer);
  };

  const accordionStep = accordionSteps.customer!;

  return (
    <View
      ref={(ref) => {
        // eslint-disable-next-line react-hooks/immutability
        stepRefs.current.customer = ref;
      }}
    >
      <AccordionStep
        stepKey="customer"
        stepNumber={3}
        title="고객 정보"
        status={accordionStep.status}
        isExpanded={accordionStep.isExpanded}
        summaryContent={<CustomerSummary />}
        onToggle={accordionStep.status === 'completed' ? handleEdit : handleToggle}
        onComplete={handleComplete}
        isCompleteDisabled={!canProceed}
        hideCompleteButton={false}
      >
        <CustomerInfoStep withScrollView={false} />
      </AccordionStep>
    </View>
  );
}
