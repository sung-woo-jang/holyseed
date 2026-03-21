import type { ReservationFormData } from '@types';
import { useFormContext } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { SummaryRow } from '../shared/SummaryRow';

/**
 * 전화번호를 표시용 형식으로 변환
 * @param phone 숫자만 있는 전화번호
 * @returns 010-1234-5678 형식
 */
function formatPhone(phone: string): string {
  if (!phone) return '';

  // 숫자만 추출
  const numbers = phone.replace(/[^0-9]/g, '');

  if (numbers.length === 11) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
  }
  if (numbers.length === 10) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6)}`;
  }

  return phone;
}

/**
 * 고객정보 입력 단계의 요약 정보
 *
 * - 고객명
 * - 연락처
 */
export function CustomerSummary() {
  const { watch } = useFormContext<ReservationFormData>();

  const customerInfo = watch('customerInfo');

  return (
    <View style={styles.container}>
      <SummaryRow label="이름" value={customerInfo.name} />
      <SummaryRow label="연락처" value={formatPhone(customerInfo.phone)} />
      {customerInfo.memo && <SummaryRow label="요청사항" value="있음" />}
      {customerInfo.photos.length > 0 && (
        <SummaryRow label="첨부사진" value={`${customerInfo.photos.length}장`} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 12,
  },
});
