import type { ReservationFormData } from '@types';
import { useFormContext } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { SummaryRow } from '../shared/SummaryRow';

/**
 * 서비스 선택 단계의 요약 정보
 *
 * - 선택된 서비스명
 * - 입력된 주소
 */
export function ServiceSummary() {
  const { watch } = useFormContext<ReservationFormData>();

  const service = watch('service');
  const address = watch('customerInfo.address');
  const detailAddress = watch('customerInfo.detailAddress');

  const fullAddress = detailAddress ? `${address} ${detailAddress}` : address;

  return (
    <View style={styles.container}>
      <SummaryRow label="서비스" value={service?.title} />
      <SummaryRow label="주소" value={fullAddress} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 12,
  },
});
