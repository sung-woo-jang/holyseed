import { StyleSheet, Text, View } from 'react-native';
import Border from '../ui/Border';
import ListHeader from '../ui/ListHeader';
import ListRow from '../ui/ListRow';
import TossEmoji from './TossEmoji';
import { useAppModeStore } from '../../stores/appMode.store';
import { APP_CATALOG } from '../../lib/appCatalog';
import { useTheme } from '../../lib/theme';

/** 더보기 화면 공용 "다른 앱으로 전환" 섹션 — 현재 앱은 목록에서 제외 */
export default function AppSwitchSection() {
  const theme = useTheme();
  const mode = useAppModeStore((s) => s.mode);
  const switchMode = useAppModeStore((s) => s.switchMode);
  const others = APP_CATALOG.filter((app) => app.mode !== mode);

  if (others.length === 0) return null;

  return (
    <>
      <ListHeader title={<ListHeader.TitleParagraph typography="t5">다른 앱</ListHeader.TitleParagraph>} />
      {others.map((app, idx) => (
        <View key={app.mode}>
          <ListRow
            left={
              <View style={[styles.iconBox, { backgroundColor: theme.brandSoft }]}>
                <TossEmoji code={app.emojiCode} size={28} />
              </View>
            }
            contents={
              <View>
                <Text style={{ color: theme.text, fontSize: 15, fontWeight: '600' }}>{app.name}</Text>
                <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 2 }}>{app.hint}</Text>
              </View>
            }
            withArrow
            onPress={() => switchMode(app.mode)}
            verticalPadding="small"
          />
          {idx < others.length - 1 && <Border type="full" />}
        </View>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  iconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
