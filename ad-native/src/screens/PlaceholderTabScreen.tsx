import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../lib/theme';
import { useAuthStore } from '../stores/auth.store';

// 각 탭 실제 화면은 다음 단계(홈→자산→거래장부→더보기 순)에서 순차적으로 교체된다.
export default function PlaceholderTabScreen({ title }: { title: string }) {
  const theme = useTheme();
  const { currentHousehold } = useAuthStore();
  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]}>
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.desc, { color: theme.textMuted }]}>
        {currentHousehold?.name ?? '가구'} · 이 탭은 다음 단계에서 구현돼요
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  title: { fontSize: 20, fontWeight: '800' },
  desc: { fontSize: 13 },
});
