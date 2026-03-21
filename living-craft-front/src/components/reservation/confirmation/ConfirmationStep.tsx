import { Card } from '@components/ui';
import { colors } from '@toss/tds-colors';
import { Button } from '@toss/tds-react-native';
import { ReservationFormData } from '@types';
import { useFormContext } from 'react-hook-form';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ConfirmationStepProps {
  /**
   * ScrollView로 감쌀지 여부 (기존 페이지 호환용)
   * @default true
   */
  withScrollView?: boolean;
  /**
   * 예약 완료 버튼 클릭 핸들러
   */
  onSubmit?: () => void;
  /**
   * 예약 완료 버튼 로딩 상태
   */
  isLoading?: boolean;
  /**
   * 예약 완료 버튼 비활성화 여부
   */
  isDisabled?: boolean;
}

export function ConfirmationStep({
  withScrollView = true,
  onSubmit,
  isLoading = false,
  isDisabled = false,
}: ConfirmationStepProps) {
  const { watch, setValue } = useFormContext<ReservationFormData>();

  const selectedService = watch('service');
  // 견적 날짜/시간
  const estimateDate = watch('estimateDate');
  const estimateTimeSlot = watch('estimateTimeSlot');
  const customerInfo = watch('customerInfo');
  const agreedToTerms = watch('agreedToTerms');

  const content = (
    <>
      <Card>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>예약 확인</Text>
          <Text style={styles.sectionSubtitle}>예약 정보를 확인해주세요</Text>
        </View>

        <View style={styles.summaryList}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>서비스</Text>
            <Text style={styles.summaryValue}>{selectedService?.title}</Text>
          </View>

          {/* 견적 희망 일정 */}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>견적 희망 날짜</Text>
            <Text style={styles.summaryValue}>{estimateDate}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>견적 희망 시간</Text>
            <Text style={styles.summaryValue}>{estimateTimeSlot?.time}</Text>
          </View>

          {/* 고객 정보 */}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>고객명</Text>
            <Text style={styles.summaryValue}>{customerInfo.name}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>연락처</Text>
            <Text style={styles.summaryValue}>{customerInfo.phone}</Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryRowLast]}>
            <Text style={styles.summaryLabel}>주소</Text>
            <Text style={styles.summaryValue}>
              {customerInfo.address} {customerInfo.detailAddress}
            </Text>
          </View>
        </View>
      </Card>

      <Card>
        <TouchableOpacity style={styles.termsCheckbox} onPress={() => setValue('agreedToTerms', !agreedToTerms)}>
          <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
            {agreedToTerms && <Text style={styles.checkboxMark}>✓</Text>}
          </View>
          <Text style={styles.termsText}>이용약관 및 개인정보처리방침에 동의합니다</Text>
        </TouchableOpacity>

        {/* 예약 완료 버튼 */}
        {onSubmit && (
          <View style={styles.submitButtonContainer}>
            <Button
              display="full"
              containerStyle={styles.submitButton}
              disabled={isDisabled || isLoading}
              loading={isLoading}
              onPress={onSubmit}
            >
              예약 완료
            </Button>
          </View>
        )}
      </Card>
    </>
  );

  if (withScrollView) {
    return (
      <ScrollView style={styles.stepContent} contentContainerStyle={styles.scrollContent}>
        {content}
      </ScrollView>
    );
  }

  return <View style={styles.stepContentNoScroll}>{content}</View>;
}

const styles = StyleSheet.create({
  stepContent: {
    flex: 1,
  },
  stepContentNoScroll: {
    paddingVertical: 10,
  },
  scrollContent: {
    paddingVertical: 10,
  },
  sectionHeader: {
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.grey900,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.grey600,
  },
  summaryList: {
    paddingHorizontal: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.grey100,
  },
  summaryRowLast: {
    borderBottomWidth: 0,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.grey600,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.grey900,
    flex: 1,
    textAlign: 'right',
  },
  termsCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: colors.grey300,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.blue500,
    borderColor: colors.blue500,
  },
  checkboxMark: {
    color: colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    color: colors.grey700,
  },
  submitButtonContainer: {
    paddingHorizontal: 8,
    paddingTop: 16,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: colors.grey100,
  },
  submitButton: {
    borderRadius: 8,
  },
});
