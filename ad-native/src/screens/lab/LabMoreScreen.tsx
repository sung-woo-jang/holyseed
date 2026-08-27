import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import TossEmoji from '../../components/common/TossEmoji';
import Border from '../../components/ui/Border';
import Button from '../../components/ui/Button';
import ListRow from '../../components/ui/ListRow';
import { clearLabTokens } from '../../lib/lab-storage';
import { useLabAuthStore } from '../../stores/labAuth.store';
import { useAppModeStore } from '../../stores/appMode.store';
import { useTheme } from '../../lib/theme';
import { TE } from '../../lib/toss-emoji';

export default function LabMoreScreen() {
  const theme = useTheme();
  const user = useLabAuthStore((s) => s.user);
  const logout = useLabAuthStore((s) => s.logout);
  const switchMode = useAppModeStore((s) => s.switchMode);
  const [logoutConfirm, setLogoutConfirm] = useState(false);

  async function handleLogout() {
    await clearLabTokens();
    logout();
  }

  return (
    <SafeAreaView edges={['top']} style={[styles.root, { backgroundColor: theme.bg }]}>
      <ScrollView>
        <View style={styles.header}>
          <View style={[styles.avatar, { backgroundColor: theme.brandSoft }]}>
            <TossEmoji code={TE.gamepad} size={28} />
          </View>
          <View>
            <Text style={{ color: theme.text, fontSize: 16, fontWeight: '700' }}>{user?.name ?? 'Lab'}</Text>
            <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 2 }}>{user?.email}</Text>
          </View>
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

        <Border type="full" height={16} />

        <View style={styles.footer}>
          <Button display="full" size="big" type="danger" style="weak" onPress={() => setLogoutConfirm(true)}>
            Lab 로그아웃
          </Button>
        </View>
      </ScrollView>

      <ConfirmDialog visible={logoutConfirm} title="로그아웃" description="Lab 계정에서 로그아웃 하시겠어요?" confirmText="로그아웃" danger onConfirm={handleLogout} onClose={() => setLogoutConfirm(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 20 },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  menuIconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  footer: { paddingHorizontal: 20, paddingVertical: 16 },
});
