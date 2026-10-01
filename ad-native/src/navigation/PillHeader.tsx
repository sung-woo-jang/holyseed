import { type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackHeaderProps } from '@react-navigation/native-stack';
import { useTheme } from '../lib/theme';

/** 같은 스택 안에서 화면을 교체(쌓이지 않음) — 화면 이름이 동적이라 타입을 느슨하게 다룸 */
export function replaceRoute(navigation: NativeStackHeaderProps['navigation'], name: string): void {
  (navigation as unknown as { replace: (routeName: string) => void }).replace(name);
}

export interface PillTab {
  name: string;
  label: string;
}

interface PillHeaderProps extends NativeStackHeaderProps {
  tabs: PillTab[];
  /** 알약 위 제목 (예: "전략", "기록") */
  title?: string;
  /** 제목과 알약 사이 영역 (예: 무한매수법 | VR 세그먼트) */
  topSlot?: ReactNode;
}

/** 스택 상단 가로스크롤 알약 탭바 — 기본 네이티브 헤더(뒤로가기) 대신 같은 스택 안의 섹션을 오갈 수 있게 함 */
export default function PillHeader({ navigation, route, tabs, title, topSlot }: PillHeaderProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ backgroundColor: theme.card, borderBottomWidth: 1, borderBottomColor: theme.border, paddingTop: insets.top }}>
      {title && <Text style={[styles.title, { color: theme.text }]}>{title}</Text>}
      {topSlot && <View style={styles.topSlot}>{topSlot}</View>}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {tabs.map((tab) => {
          const active = tab.name === route.name;
          return (
            <Pressable
              key={tab.name}
              // replace: 알약을 누를 때마다 화면이 스택에 쌓이지 않게 현재 화면을 교체
              onPress={() => !active && replaceRoute(navigation, tab.name)}
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

/** 알약 없이 뒤로가기만 있는 하위 화면(사이클 상세 등) 헤더 */
export function BackHeader({ navigation, title }: { navigation: NativeStackHeaderProps['navigation']; title: string }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.backRow, { backgroundColor: theme.card, borderBottomColor: theme.border, paddingTop: insets.top }]}>
      <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={styles.backBtn}>
        <Text style={{ color: theme.text, fontSize: 28, lineHeight: 30 }}>‹</Text>
      </Pressable>
      <Text style={{ color: theme.text, fontSize: 15, fontWeight: '700' }}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 15, fontWeight: '700', textAlign: 'center', paddingTop: 12 },
  topSlot: { paddingHorizontal: 12, paddingTop: 10 },
  row: { flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingVertical: 10 },
  tab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 6, borderBottomWidth: 1, paddingHorizontal: 12, paddingBottom: 10, minHeight: 52 },
  backBtn: { paddingHorizontal: 6 },
});
