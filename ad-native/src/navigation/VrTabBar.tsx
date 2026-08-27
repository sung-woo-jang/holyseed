import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackHeaderProps } from '@react-navigation/native-stack';
import { useTheme } from '../lib/theme';
import type { VrStackParamList } from './VrStack';

const VR_TABS: { name: keyof VrStackParamList; label: string }[] = [
  { name: 'VrOverview', label: '개요' },
  { name: 'VrFills', label: '체결 내역' },
  { name: 'VrLadder', label: '매수/매도표' },
  { name: 'VrTrend', label: '추이' },
  { name: 'VrSystem', label: '시스템' },
];

/** VR 스택 전용 상단 가로스크롤 탭바 — 기본 네이티브 헤더(뒤로가기) 대신 항상 5개 섹션을 오갈 수 있게 함 */
export default function VrTabBar({ navigation, route }: NativeStackHeaderProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ backgroundColor: theme.card, borderBottomWidth: 1, borderBottomColor: theme.border, paddingTop: insets.top }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {VR_TABS.map((tab) => {
          const active = tab.name === route.name;
          return (
            <Pressable
              key={tab.name}
              onPress={() => navigation.navigate(tab.name)}
              style={[styles.tab, { backgroundColor: active ? theme.brand : theme.bg }]}
            >
              <Text style={{ color: active ? '#fff' : theme.text, fontSize: 13, fontWeight: '700' }}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingVertical: 10 },
  tab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 },
});
