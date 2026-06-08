import React from 'react';
import { createRoute } from '@granite-js/react-native';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Switch } from '@toss/tds-react-native';
import ScreenHeader from '../../components/common/ScreenHeader';
import { useTheme } from '../../lib/theme';
import { useAuthStore } from '../../stores/auth.store';

function SettingsScreen({ navigation }: { navigation: any }) {
  const theme = useTheme();
  const { useMock, setUseMock } = useAuthStore();

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]}>
      <ScreenHeader title="설정" onBack={() => navigation?.goBack?.()} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* 개발자 옵션 */}
        <View style={[styles.sectionHeader, { marginTop: 16 }]}>
          <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>개발자 옵션</Text>
        </View>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text style={[styles.rowLabel, { color: theme.text }]}>목업 데이터 사용</Text>
              <Text style={[styles.rowSub, { color: theme.textMuted }]}>실제 서버 대신 로컬 더미 데이터로 표시</Text>
            </View>
            <Switch
              checked={useMock}
              onCheckedChange={setUseMock}
            />
          </View>
        </View>

        {/* 알림 — placeholder */}
        <View style={[styles.sectionHeader, { marginTop: 20 }]}>
          <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>알림</Text>
        </View>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.row, { borderBottomWidth: 1, borderBottomColor: theme.border }]}>
            <View style={styles.rowText}>
              <Text style={[styles.rowLabel, { color: theme.text }]}>스냅샷 리마인더</Text>
              <Text style={[styles.rowSub, { color: theme.textMuted }]}>매달 말일 스냅샷 입력을 알려드려요</Text>
            </View>
            <Switch checked={false} onCheckedChange={() => {}} disabled />
          </View>
          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text style={[styles.rowLabel, { color: theme.text }]}>정기지출 알림</Text>
              <Text style={[styles.rowSub, { color: theme.textMuted }]}>결제일 하루 전 미리 알려드려요</Text>
            </View>
            <Switch checked={false} onCheckedChange={() => {}} disabled />
          </View>
        </View>

        {/* 통화 — placeholder */}
        <View style={[styles.sectionHeader, { marginTop: 20 }]}>
          <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>통화</Text>
        </View>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text style={[styles.rowLabel, { color: theme.text }]}>기본 통화</Text>
              <Text style={[styles.rowSub, { color: theme.textMuted }]}>현재 KRW · 추후 설정 지원 예정</Text>
            </View>
            <Text style={[styles.rowValue, { color: theme.textMuted }]}>KRW</Text>
          </View>
        </View>

        <Text style={[styles.footer, { color: theme.textMuted }]}>자산일기 v1.0 · Apps-in-Toss</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  sectionHeader: { paddingHorizontal: 20, marginBottom: 8 },
  sectionLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  card: { marginHorizontal: 20, borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  rowText: { flex: 1 },
  rowLabel: { fontSize: 15, fontWeight: '600' },
  rowSub: { fontSize: 12, marginTop: 2 },
  rowValue: { fontSize: 14, fontWeight: '600' },
  footer: { textAlign: 'center', fontSize: 12, marginTop: 32 },
});

export const Route = createRoute('/more/settings', {
  component: SettingsScreen,
});
