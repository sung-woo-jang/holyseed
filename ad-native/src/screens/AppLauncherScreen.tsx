import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import TossEmoji from '../components/common/TossEmoji';
import { useAppModeStore, type AppMode } from '../stores/appMode.store';
import { useTheme } from '../lib/theme';
import { TE } from '../lib/toss-emoji';

const APPS: { mode: AppMode; emojiCode: string; name: string; hint: string }[] = [
  { mode: 'assetDiary', emojiCode: TE.ledger, name: '자산일기', hint: '홈 · 자산 · 가계부' },
  { mode: 'laofus', emojiCode: TE.chartUp, name: '라오어', hint: '무매 · TQQQ VR' },
  { mode: 'worklog', emojiCode: TE.briefcase, name: '근무일지', hint: '근무 기록 · 급여 계산' },
];

interface AppLauncherScreenProps {
  /** 이 런처가 속한 탭 내비게이터에서, 그 앱의 메인 화면에 해당하는 탭 라우트 이름 */
  homeRoute: string;
  /** homeRoute 탭이 자체 스택 내비게이터라면, 그 스택의 첫 화면(메인 화면) 이름 */
  homeNestedScreen?: string;
}

/** 3개 앱(자산일기/라오어/근무일지) 공용 전환 런처 — 각 앱 탭바의 "앱" 탭에 등록됨 */
export default function AppLauncherScreen({ homeRoute, homeNestedScreen }: AppLauncherScreenProps) {
  const theme = useTheme();
  const navigation = useNavigation();
  const mode = useAppModeStore((s) => s.mode);
  const switchMode = useAppModeStore((s) => s.switchMode);

  function goToApp(target: AppMode, current: boolean) {
    if (current) {
      // 이미 이 앱이면 모드 전환 없이 그 앱의 메인 화면으로만 이동
      // 이 화면은 3개 앱의 서로 다른 탭 내비게이터에서 공용으로 쓰여 부모 타입을 특정할 수 없어 any로 처리
      const parent = navigation.getParent() as any;
      if (homeNestedScreen) parent?.navigate(homeRoute, { screen: homeNestedScreen });
      else parent?.navigate(homeRoute);
      return;
    }
    switchMode(target);
  }

  return (
    <SafeAreaView edges={['top']} style={[styles.root, { backgroundColor: theme.bg }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>어느 앱으로 갈까요?</Text>
      </View>

      <View style={styles.list}>
        {APPS.map((app) => {
          const current = app.mode === mode;
          return (
            <Pressable
              key={app.mode}
              style={[
                styles.card,
                { backgroundColor: theme.card, borderColor: current ? theme.brand : theme.border },
                current && { backgroundColor: theme.brandSoft },
              ]}
              onPress={() => goToApp(app.mode, current)}
            >
              <View style={[styles.iconBox, { backgroundColor: theme.bg }]}>
                <TossEmoji code={app.emojiCode} size={26} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.text, fontSize: 15, fontWeight: '700' }}>{app.name}</Text>
                <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 2 }}>{app.hint}</Text>
              </View>
              {current && <Text style={{ color: theme.brand, fontSize: 12, fontWeight: '700' }}>보는 중</Text>}
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 19, fontWeight: '800' },
  list: { paddingHorizontal: 20, paddingTop: 12, gap: 10 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1.5, borderRadius: 16, padding: 16 },
  iconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
