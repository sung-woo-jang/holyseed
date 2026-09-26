import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../components/ui/Button';
import Section from '../components/common/Section';
import AppSwitchSection from '../components/common/AppSwitchSection';
import ListRow from '../components/ui/ListRow';
import Border from '../components/ui/Border';
import TossEmoji from '../components/common/TossEmoji';
import { useOtaUpdate } from '../lib/useOtaUpdate';
import { useTheme } from '../lib/theme';

interface AppMoreMenuItem {
  emojiCode: string;
  bgColor?: string;
  label: string;
  detail: string;
  onPress: () => void;
}

interface AppMoreScreenProps {
  /** 이 "더보기"가 속한 앱 이름 (헤더 표시용) */
  appName: string;
  /** 이 앱 모드에서만 보여줄 전용 메뉴 항목 — 없으면 "메뉴" 섹션 자체가 안 나옴 */
  menuItems?: AppMoreMenuItem[];
}

/** 라오어·근무일지 앱 공용 "더보기" — 자산일기의 SettingsScreen만큼 항목이 많지 않아 가벼운 버전으로 별도 구성 */
export default function AppMoreScreen({ appName, menuItems }: AppMoreScreenProps) {
  const theme = useTheme();
  const { updateLabel, checking, checkForUpdate } = useOtaUpdate();

  return (
    <SafeAreaView edges={['top']} style={[styles.root, { backgroundColor: theme.bg }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={styles.headerWrap}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>{appName} 더보기</Text>
        </View>

        {menuItems && menuItems.length > 0 && (
          <Section label="메뉴">
            {menuItems.map((item, idx) => (
              <View key={item.label}>
                <ListRow
                  left={
                    <View style={[styles.menuIconBox, { backgroundColor: item.bgColor ?? theme.brandSoft }]}>
                      <TossEmoji code={item.emojiCode} size={26} />
                    </View>
                  }
                  contents={
                    <View>
                      <Text style={{ color: theme.text, fontSize: 14.5, fontWeight: '600' }}>{item.label}</Text>
                      <Text style={{ color: theme.textMuted, fontSize: 11.5, marginTop: 2 }}>{item.detail}</Text>
                    </View>
                  }
                  withArrow
                  onPress={item.onPress}
                  verticalPadding="small"
                />
                {idx < menuItems.length - 1 && <Border type="full" />}
              </View>
            ))}
          </Section>
        )}

        <AppSwitchSection />

        <Section label="업데이트">
          <View style={styles.updateBody}>
            <Text style={{ color: theme.textMuted, fontSize: 12, marginBottom: 10 }}>{updateLabel}</Text>
            <Button display="full" size="medium" type="primary" style="weak" loading={checking} onPress={checkForUpdate}>
              지금 업데이트 확인
            </Button>
          </View>
        </Section>

        <Text style={{ textAlign: 'center', fontSize: 12, marginTop: 22, color: theme.textMuted }}>ad-native v1.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerWrap: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 6 },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  updateBody: { padding: 16 },
  menuIconBox: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
