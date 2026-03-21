import { useFormContext } from 'react-hook-form';

import type { ReservationFormData, StepKey } from '../types';

interface UseReservationValidationReturn {
  canProceedToNext: (step: StepKey) => boolean;
}

/**
 * FormContext에서 폼 값을 읽어 각 단계의 완료 여부를 검증하는 훅
 * Container 컴포넌트들이 독립적으로 사용할 수 있도록 설계됨
 */
export function useReservationValidation(): UseReservationValidationReturn {
  const { watch } = useFormContext<ReservationFormData>();
  const watchedValues = watch();

  const canProceedToNext = (step: StepKey): boolean => {
    switch (step) {
      case 'service':
        // 서비스 선택 + 주소 입력 완료
        return watchedValues.service !== null && watchedValues.customerInfo.address.trim() !== '';
      case 'datetime':
        // 견적 날짜 + 시간 필수
        return watchedValues.estimateDate !== '' && watchedValues.estimateTimeSlot !== null;
      case 'customer':
        // 이름, 연락처 필수 (주소는 service 단계에서 이미 입력됨)
        return watchedValues.customerInfo.name.trim() !== '' && watchedValues.customerInfo.phone.trim() !== '';
      case 'confirmation':
        return watchedValues.agreedToTerms;
      default:
        return false;
    }
  };

  return { canProceedToNext };
}
