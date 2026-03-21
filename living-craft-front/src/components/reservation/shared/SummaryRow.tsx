import { colors } from '@toss/tds-colors';
import { StyleSheet, Text, View } from 'react-native';

interface SummaryRowProps {
  /**
   * 라벨 (왼쪽)
   */
  label: string;
  /**
   * 값 (오른쪽)
   */
  value?: string | null;
  /**
   * 값이 없을 때 표시할 텍스트
   */
  placeholder?: string;
}

/**
 * 요약 정보의 한 행을 표시하는 컴포넌트
 */
export function SummaryRow({ label, value, placeholder = '-' }: SummaryRowProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, !value && styles.placeholder]}>
        {value || placeholder}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  label: {
    fontSize: 14,
    color: colors.grey600,
  },
  value: {
    fontSize: 14,
    color: colors.grey900,
    fontWeight: '500',
    maxWidth: '60%',
    textAlign: 'right',
  },
  placeholder: {
    color: colors.grey400,
  },
});
