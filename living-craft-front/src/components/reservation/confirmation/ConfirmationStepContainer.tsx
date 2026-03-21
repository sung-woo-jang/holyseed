import { AccordionStep } from '@components/ui/accordion-step';
import { useScrollContext } from '@contexts';
import { useCreateReservation, useReservationValidation } from '@hooks';
import { useReservationStore } from '@store';
import { Toast } from '@toss/tds-react-native';
import type { ReservationFormData } from '@types';
import { safeLayoutAnimation } from '@utils';
import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { View } from 'react-native';

import { ConfirmationStep } from './ConfirmationStep';

export interface ConfirmationStepContainerProps {
  onSubmitSuccess?: () => void;
}

export function ConfirmationStepContainer({ onSubmitSuccess }: ConfirmationStepContainerProps) {
  // ===== Context =====
  const { stepRefs } = useScrollContext();

  // ===== Store =====
  const { accordionSteps, toggleStepExpanded, isLoading, update } = useReservationStore([
    'accordionSteps',
    'toggleStepExpanded',
    'isLoading',
    'update',
  ]);

  // ===== Form =====
  const { getValues } = useFormContext<ReservationFormData>();
  const { canProceedToNext } = useReservationValidation();
  const canProceed = canProceedToNext('confirmation');

  // ===== Data Mutation =====
  const { mutateAsync: createReservation } = useCreateReservation();

  // ===== Toast State =====
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [retryCallback, setRetryCallback] = useState<(() => void) | null>(null);

  // ===== 핸들러 =====
  const handleToggle = () => {
    safeLayoutAnimation();
    toggleStepExpanded('confirmation');
  };

  const handleSubmit = async () => {
    if (!canProceed) {
      setToastMessage('이용약관에 동의해주세요.');
      setToastOpen(true);
      return;
    }

    update({ isLoading: true });

    try {
      const values = getValues();

      // 필수 값 검증
      if (!values.service?.id) {
        throw new Error('서비스를 선택해주세요.');
      }
      if (!values.estimateDate || !values.estimateTimeSlot?.time) {
        throw new Error('견적 날짜와 시간을 선택해주세요.');
      }

      // API 명세서 형식에 맞게 예약 데이터 구성
      // 백엔드가 multipart/form-data로 파일을 직접 받으므로 사진을 함께 전송
      const reservationData = {
        serviceId: values.service.id.toString(),
        estimateDate: values.estimateDate,
        estimateTime: values.estimateTimeSlot.time,
        address: values.customerInfo.address,
        detailAddress: values.customerInfo.detailAddress,
        customerName: values.customerInfo.name,
        customerPhone: values.customerInfo.phone,
        memo: values.customerInfo.memo,
        photos: values.customerInfo.photos, // ImageState 배열 직접 전달
      };

      // 예약 생성
      await createReservation(reservationData);

      // onSubmitSuccess 콜백 호출 (상태 초기화 + 홈 이동)
      // useCreateReservation의 전역 Toast가 자동으로 표시됨
      onSubmitSuccess?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : '예약 처리 중 오류가 발생했습니다.';
      setToastMessage(message);
      setToastOpen(true);
    } finally {
      update({ isLoading: false });
    }
  };

  const handleRetry = () => {
    setToastOpen(false);
    if (retryCallback) {
      retryCallback();
      setRetryCallback(null);
    }
  };

  const accordionStep = accordionSteps.confirmation!;

  return (
    <View ref={(ref) => (stepRefs.current.confirmation = ref)}>
      <AccordionStep
        stepKey="confirmation"
        stepNumber={4}
        title="예약 확인"
        status={accordionStep.status}
        isExpanded={accordionStep.isExpanded}
        onToggle={handleToggle}
      >
        <ConfirmationStep
          withScrollView={false}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          isDisabled={!canProceed}
        />
      </AccordionStep>

      {/* Toast */}
      <Toast
        open={toastOpen}
        text={toastMessage}
        position="bottom"
        onClose={() => setToastOpen(false)}
        button={retryCallback ? <Toast.Button onPress={handleRetry}>재시도</Toast.Button> : undefined}
      />
    </View>
  );
}
