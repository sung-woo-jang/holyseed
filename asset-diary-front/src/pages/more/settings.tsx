import React from 'react';
import { createRoute } from '@granite-js/react-native';
import { StyleSheet, Text, View } from 'react-native';
import { Border, ListHeader, ListRow, Switch } from '@toss/tds-react-native';
import ScreenHeader from '../../components/common/ScreenHeader';
import { useTheme } from '../../lib/theme';
import { useAuthStore } from '../../stores/auth.store';

function SettingsScreen({ navigation }: { navigation: any }) {
  const theme = useTheme();
  const { useMock, setUseMock } = useAuthStore();

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]}>
      <ScreenHeader title="설정" onBack={() => navigation?.goBack?.()} />

      <Border type="height16" />

      {/* 개발자 옵션 */}
      <ListHeader title={<ListHeader.TitleParagraph typography="t5">개발자 옵션</ListHeader.TitleParagraph>} />
      <ListRow
        contents="목업 데이터 사용"
        right={<Switch checked={useMock} onCheckedChange={setUseMock} />}
        verticalPadding="small"
      />

      <Border type="height16" />

      {/* 알림 */}
      <ListHeader title={<ListHeader.TitleParagraph typography="t5">알림</ListHeader.TitleParagraph>} />
      <ListRow
        contents="스냅샷 리마인더"
        right={<Switch checked={false} onCheckedChange={() => {}} disabled />}
        verticalPadding="small"
      />
      <Border type="full" />
      <ListRow
        contents="정기지출 알림"
        right={<Switch checked={false} onCheckedChange={() => {}} disabled />}
        verticalPadding="small"
      />

      <Border type="height16" />

      {/* 통화 */}
      <ListHeader title={<ListHeader.TitleParagraph typography="t5">통화</ListHeader.TitleParagraph>} />
      <ListRow
        contents="기본 통화"
        right={<Text style={[styles.valueText, { color: theme.textMuted }]}>KRW</Text>}
        verticalPadding="small"
      />

      <Border type="height16" />

      <Text style={[styles.footer, { color: theme.textMuted }]}>자산일기 v1.0 · Apps-in-Toss</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  valueText: { fontSize: 14, fontWeight: '600' },
  footer: { textAlign: 'center', fontSize: 12, marginTop: 16 },
});

export const Route = createRoute('/more/settings', {
  component: SettingsScreen,
});
