import type { ReservationFormData } from '@types';
import { useFormContext } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { SummaryRow } from '../shared/SummaryRow';

/**
 * 날짜를 표시용 문자열로 변환
 * @param dateString YYYY-MM-DD 형식
 * @returns YYYY년 MM월 DD일 형식
 */
function formatDate(dateString: string): string {
  if (!dateString) return '';

  const parts = dateString.split('-');
  if (parts.length !== 3) return dateString;

  const [year, month, day] = parts;
  return `${year}년 ${parseInt(month ?? '0', 10)}월 ${parseInt(day ?? '0', 10)}일`;
}

/**
 * 날짜/시간 선택 단계의 요약 정보
 *
 * - 견적 희망 날짜
 * - 견적 희망 시간
 */
export function DateTimeSummary() {
  const { watch } = useFormContext<ReservationFormData>();

  const estimateDate = watch('estimateDate');
  const estimateTimeSlot = watch('estimateTimeSlot');

  return (
    <View style={styles.container}>
      <SummaryRow label="견적 날짜" value={formatDate(estimateDate)} />
      <SummaryRow label="견적 시간" value={estimateTimeSlot?.time} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 12,
  },
});
