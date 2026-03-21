import { useCreateReservation } from '@api';
import { useForm, UseFormReturn } from 'react-hook-form';
import { Alert } from 'react-native';

import { useReservationStore } from '../store';
import { DEFAULT_FORM_VALUES, ReservationFormData, StepKey } from '../types';

interface UseReservationFormOptions {
  initialData?: Partial<ReservationFormData>;
  onSubmitSuccess?: () => void;
}

interface UseReservationFormReturn {
  // react-hook-form methods (FormProvider에 전달)
  methods: UseFormReturn<ReservationFormData>;

  // Validation
  canProceedToNext: (step: StepKey) => boolean;
  validateStep: (step: StepKey) => boolean;

  // Actions
  handleSubmit: () => Promise<void>;
  onSubmitSuccess?: () => void;
}

export function useReservationForm(options?: UseReservationFormOptions): UseReservationFormReturn {
  // immer Proxy를 plain object로 변환
  const defaultValues: ReservationFormData = {
    ...DEFAULT_FORM_VALUES,
    // initialData가 있으면 deep clone하여 plain object로 변환
    ...(options?.initialData
      ? JSON.parse(JSON.stringify(options.initialData))
      : {}),
  };

  // react-hook-form
  const methods = useForm<ReservationFormData>({
    defaultValues,
    mode: 'onChange',
  });

  const { getValues, watch } = methods;

  // 폼 값 변경을 구독하여 버튼 상태 업데이트
  const watchedValues = watch();

  // zustand store
  const { update } = useReservationStore(['update']);

  // TanStack Query mutation
  const { mutateAsync: createReservation } = useCreateReservation();

  /**
   * 특정 단계의 필수 입력값이 완료되었는지 검증 (watch 사용 - 리렌더링 트리거)
   */
  const canProceedToNext = (step: StepKey): boolean => {
    const values = watchedValues;

    switch (step) {
      case 'service':
        // 서비스 선택 + 주소 입력 완료
        return values.service !== null && values.customerInfo.address.trim() !== '';
      case 'datetime': {
        // 견적 날짜 + 시간 필수
        return values.estimateDate !== '' && values.estimateTimeSlot !== null;
      }
      case 'customer':
        // 이름, 연락처 필수 (주소는 service 단계에서 이미 입력됨)
        return values.customerInfo.name.trim() !== '' && values.customerInfo.phone.trim() !== '';
      case 'confirmation':
        return values.agreedToTerms;
      default:
        return false;
    }
  };

  /**
   * 특정 단계 완료 여부 확인 (getValues 사용 - 이전 단계 검증용)
   */
  const validateStep = (step: StepKey): boolean => {
    const values = getValues();

    switch (step) {
      case 'service':
        // 서비스 선택 + 주소 입력 완료
        return values.service !== null && values.customerInfo.address.trim() !== '';
      case 'datetime': {
        // 견적 날짜 + 시간 필수
        return values.estimateDate !== '' && values.estimateTimeSlot !== null;
      }
      case 'customer':
        // 이름, 연락처 필수 (주소는 service 단계에서 이미 입력됨)
        return values.customerInfo.name.trim() !== '' && values.customerInfo.phone.trim() !== '';
      case 'confirmation':
        return values.agreedToTerms;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    if (!canProceedToNext('confirmation')) {
      Alert.alert('알림', '이용약관에 동의해주세요.');
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

      // API 명세서 형식에 맞게 데이터 평탄화
      // 백엔드가 multipart/form-data로 파일을 직접 받으므로 ImageState 배열 전달
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

      // 실제 API 호출
      await createReservation(reservationData);

      Alert.alert('예약 완료', '예약이 성공적으로 완료되었습니다!', [
        {
          text: '확인',
          onPress: () => options?.onSubmitSuccess?.(),
        },
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : '예약 처리 중 오류가 발생했습니다.';
      Alert.alert('오류', message);
    } finally {
      update({ isLoading: false });
    }
  };

  return {
    methods,
    canProceedToNext,
    validateStep,
    handleSubmit,
    onSubmitSuccess: options?.onSubmitSuccess,
  };
}
