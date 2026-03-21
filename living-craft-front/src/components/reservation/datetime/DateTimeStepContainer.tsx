import { AccordionStep } from '@components/ui/accordion-step';
import { useScrollContext } from '@contexts';
import { useReservationValidation } from '@hooks';
import { useReservationStore } from '@store';
import { safeLayoutAnimation, scheduleScrollToStep } from '@utils';
import { View } from 'react-native';

import { DateTimeSelectionStep } from './DateTimeSelectionStep';
import { DateTimeSummary } from './DateTimeSummary';

export function DateTimeStepContainer() {
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
  const canProceed = canProceedToNext('datetime');

  // ===== 핸들러 =====
  const handleToggle = () => {
    safeLayoutAnimation();
    toggleStepExpanded('datetime');
  };

  const handleComplete = () => {
    safeLayoutAnimation();
    completeStep('datetime');

    // 자동 스크롤
    scheduleScrollToStep(scrollViewRef, stepRefs.current.customer);
  };

  const handleEdit = () => {
    safeLayoutAnimation();
    goToStep('service');
    scheduleScrollToStep(scrollViewRef, stepRefs.current.service);
  };

  const accordionStep = accordionSteps.datetime!;

  return (
    <View
      ref={(ref) => {
        // eslint-disable-next-line react-hooks/immutability
        stepRefs.current.datetime = ref;
      }}
    >
      <AccordionStep
        stepKey="datetime"
        stepNumber={2}
        title="날짜/시간 선택"
        status={accordionStep.status}
        isExpanded={accordionStep.isExpanded}
        summaryContent={<DateTimeSummary />}
        onToggle={accordionStep.status === 'completed' ? handleEdit : handleToggle}
        onComplete={handleComplete}
        isCompleteDisabled={!canProceed}
        hideCompleteButton={false}
      >
        <DateTimeSelectionStep withScrollView={false} />
      </AccordionStep>
    </View>
  );
}
