import { getServiceableRegionsForService } from '@api';
import { AccordionStep } from '@components/ui/accordion-step';
import { useScrollContext } from '@contexts';
import { useReservationValidation, useServices } from '@hooks';
import { useReservationStore } from '@store';
import type { ReservationFormData } from '@types';
import { safeLayoutAnimation, scheduleScrollToStep } from '@utils';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { View } from 'react-native';

import { AddressManagementSection } from './AddressManagementSection';
import { ServiceSelectionStep } from './ServiceSelectionStep';
import { ServiceSummary } from './ServiceSummary';

export interface ServiceStepContainerProps {
  serviceIdParam: number | null;
}

export function ServiceStepContainer({ serviceIdParam }: ServiceStepContainerProps) {
  // ===== Context =====
  const { scrollViewRef, stepRefs } = useScrollContext();

  // ===== Store =====
  const {
    accordionSteps,
    toggleStepExpanded,
    completeStep,
    goToStep,
    resetAddressSearch,
    resetEstimateFeeInfo,
    addressSelection,
    update,
  } = useReservationStore([
    'accordionSteps',
    'toggleStepExpanded',
    'completeStep',
    'goToStep',
    'resetAddressSearch',
    'resetEstimateFeeInfo',
    'addressSelection',
    'update',
  ]);

  // ===== Form =====
  const { setValue, watch } = useFormContext<ReservationFormData>();
  const { canProceedToNext } = useReservationValidation();

  // ===== Data Fetching =====
  const { data: services } = useServices();

  // ===== Computed =====
  const currentService = watch('service');
  const currentAddress = watch('customerInfo.address');
  const hasAddress = Boolean(currentAddress?.trim());
  const canProceed = canProceedToNext('service') && hasAddress;

  const filteredRegions = useMemo(() => {
    if (!currentService || !services) return [];
    return getServiceableRegionsForService(services, currentService.id);
  }, [currentService, services]);

  // ===== Refs =====
  const paramsProcessedRef = useRef(false);
  const prevServiceIdRef = useRef<number | null>(null);

  // ===== 핸들러 =====
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

  // ===== 서비스 변경 시 주소 초기화 핸들러 =====
  const resetAddressState = useCallback(() => {
    resetAddressSearch();
    resetEstimateFeeInfo();
    setValue('customerInfo.address', '');
    setValue('customerInfo.detailAddress', '');
  }, [resetAddressSearch, resetEstimateFeeInfo, setValue]);

  // ===== Query params 기반 서비스 자동 선택 =====
  useEffect(() => {
    if (currentService) return;
    if (paramsProcessedRef.current) return;

    if (serviceIdParam && services && services.length > 0) {
      const targetService = services.find((s) => s.id === serviceIdParam);
      if (targetService) {
        setValue('service', targetService);
        paramsProcessedRef.current = true;
      }
    }
  }, [serviceIdParam, services, currentService, setValue]);

  // ===== 서비스 변경 감지 =====
  useEffect(() => {
    if (!currentService) {
      prevServiceIdRef.current = null;
      return;
    }

    // 초기 마운트 시에는 실행하지 않음
    if (prevServiceIdRef.current === null) {
      prevServiceIdRef.current = currentService.id;
      return;
    }

    // 실제로 서비스가 변경된 경우에만 주소 초기화
    if (prevServiceIdRef.current !== currentService.id) {
      resetAddressState();
      prevServiceIdRef.current = currentService.id;
    }
  }, [currentService?.id, resetAddressState]);

  // ===== 서비스 선택 시 자동으로 지역 선택 시트 열기 =====
  useEffect(() => {
    if (currentService && !addressSelection.region && !addressSelection.city) {
      update({ isRegionBottomSheetOpen: true });
    }
  }, [currentService?.id, addressSelection.region, addressSelection.city, update]);

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
        <ServiceSelectionStep withScrollView={false} />
        <AddressManagementSection
          currentService={currentService}
          services={services}
          filteredRegions={filteredRegions}
        />
      </AccordionStep>
    </View>
  );
}
