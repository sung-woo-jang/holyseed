import { ConfirmationStepContainer } from '@components/reservation/confirmation/ConfirmationStepContainer';
import { CustomerStepContainer } from '@components/reservation/customer/CustomerStepContainer';
import { DateTimeStepContainer } from '@components/reservation/datetime/DateTimeStepContainer';
import { ServiceStepContainer } from '@components/reservation/service/ServiceStepContainer';
import { ScrollProvider } from '@contexts';
import { createRoute } from '@granite-js/react-native';
import { useReservationForm } from '@hooks';
import { useFocusEffect } from '@react-navigation/native';
import { useReservationStore } from '@store';
import { colors } from '@toss/tds-colors';
import { DEFAULT_FORM_VALUES } from '@types';
import { useCallback, useEffect } from 'react';
import { FormProvider } from 'react-hook-form';
import { Alert, BackHandler, ScrollView, StyleSheet, Text, View } from 'react-native';

/**
 * 예약 페이지
 *
 * 변경 사항 (Phase 3):
 * - serviceId URL 파라미터 제거 (서비스는 페이지 내에서 선택)
 */
export const Route = createRoute('/reservation', {
  component: Page,
});

function Page() {
  const navigation = Route.useNavigation();

  // ===== Store =====
  const {
    isLoading,
    reset: resetStore,
    resetAccordionSteps,
  } = useReservationStore(['isLoading', 'reset', 'resetAccordionSteps']);

  // ===== Form =====
  const handleSubmitSuccess = () => {
    resetStore();
    resetAccordionSteps();
    methods.reset(DEFAULT_FORM_VALUES);
    navigation.navigate('/reservation/success');
  };

  const { methods } = useReservationForm({
    initialData: DEFAULT_FORM_VALUES,
    onSubmitSuccess: handleSubmitSuccess,
  });

  // ===== 로딩 중 뒤로가기 차단 =====
  useEffect(() => {
    if (!isLoading) return;
    const handleBackPress = () => {
      Alert.alert('처리 중', '예약 처리가 진행 중입니다. 잠시만 기다려주세요.');
      return true;
    };
    BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => BackHandler.removeEventListener('hardwareBackPress', handleBackPress);
  }, [isLoading]);

  // ===== 페이지 이탈 시 상태 초기화 =====
  useFocusEffect(
    useCallback(() => {
      // cleanup 함수 반환 (페이지 blur 시 실행)
      return () => {
        // 로딩 중이 아닐 때만 초기화 (API 요청 중 상태 보호)
        if (!isLoading) {
          resetStore();
          resetAccordionSteps();
          methods.reset(DEFAULT_FORM_VALUES);
        }
      };
    }, [isLoading, resetStore, resetAccordionSteps, methods]),
  );

  // ===== 로딩 상태 =====
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>예약을 처리하고 있습니다...</Text>
      </View>
    );
  }

  return (
    <FormProvider {...methods}>
      <ScrollProvider>
        <View style={styles.container}>
          <ScrollView
            style={styles.contentContainer}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets
          >
            <ServiceStepContainer />
            <DateTimeStepContainer />
            <CustomerStepContainer />
            <ConfirmationStepContainer onSubmitSuccess={handleSubmitSuccess} />
          </ScrollView>
        </View>
      </ScrollProvider>
    </FormProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.greyBackground,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.greyBackground,
  },
  loadingText: {
    fontSize: 16,
    color: colors.grey700,
  },
  contentContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 16,
    paddingHorizontal: 4,
    gap: 12,
  },
});
