import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../lib/theme';

interface SectionProps {
  label?: string;
  children: ReactNode;
}

/** 더보기 탭 등에서 카드 하나로 항목을 묶는 공용 섹션 래퍼 */
export default function Section({ label, children }: SectionProps) {
  const theme = useTheme();
  return (
    <View style={styles.wrap}>
      {label && <Text style={[styles.label, { color: theme.textMuted }]}>{label}</Text>}
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 20, paddingTop: 18 },
  label: { fontSize: 11.5, fontWeight: '800', letterSpacing: 0.3, textTransform: 'uppercase', marginBottom: 8, marginLeft: 2 },
  card: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
});
