import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TossEmoji from '../../components/common/TossEmoji';
import Border from '../../components/ui/Border';
import ListRow from '../../components/ui/ListRow';
import { useAppModeStore } from '../../stores/appMode.store';
import { useTheme } from '../../lib/theme';
import { TE } from '../../lib/toss-emoji';

export default function LabMoreScreen() {
  const theme = useTheme();
  const switchMode = useAppModeStore((s) => s.switchMode);

  return (
    <SafeAreaView edges={['top']} style={[styles.root, { backgroundColor: theme.bg }]}>
      <ScrollView>
        <View style={styles.header}>
          <View style={[styles.avatar, { backgroundColor: theme.brandSoft }]}>
            <TossEmoji code={TE.gamepad} size={28} />
          </View>
          <Text style={{ color: theme.text, fontSize: 16, fontWeight: '700' }}>Lab 모드</Text>
        </View>

        <Border type="full" height={16} />

        <ListRow
          left={
            <View style={[styles.menuIconBox, { backgroundColor: theme.brandSoft }]}>
              <TossEmoji code={TE.ledger} size={24} />
            </View>
          }
          contents={<Text style={{ color: theme.text, fontSize: 15, fontWeight: '600' }}>자산일기로 전환</Text>}
          withArrow
          onPress={() => switchMode('assetDiary')}
          verticalPadding="small"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 20 },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  menuIconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
