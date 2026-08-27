import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Border from '../components/ui/Border';
import Button from '../components/ui/Button';
import ListHeader from '../components/ui/ListHeader';
import { useOtaUpdate } from '../lib/useOtaUpdate';
import { useTheme } from '../lib/theme';

interface AppMoreScreenProps {
  /** 이 "더보기"가 속한 앱 이름 (헤더 표시용) */
  appName: string;
}

/** 라오어·근무일지 앱 공용 "더보기" — 자산일기의 SettingsScreen만큼 항목이 많지 않아 가벼운 버전으로 별도 구성 */
export default function AppMoreScreen({ appName }: AppMoreScreenProps) {
  const theme = useTheme();
  const { updateLabel, checking, checkForUpdate } = useOtaUpdate();

  return (
    <SafeAreaView edges={['top']} style={[styles.root, { backgroundColor: theme.bg }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <ListHeader title={<ListHeader.TitleParagraph typography="t4">{appName} 더보기</ListHeader.TitleParagraph>} />

        <Border type="full" height={16} />

        <ListHeader title={<ListHeader.TitleParagraph typography="t5">업데이트</ListHeader.TitleParagraph>} />
        <View style={{ paddingHorizontal: 20 }}>
          <Text style={{ color: theme.textMuted, fontSize: 12, marginBottom: 10 }}>{updateLabel}</Text>
          <Button display="full" size="medium" type="primary" style="weak" loading={checking} onPress={checkForUpdate}>
            지금 업데이트 확인
          </Button>
        </View>

        <Border type="full" height={16} />

        <Text style={{ textAlign: 'center', fontSize: 12, marginTop: 16, color: theme.textMuted }}>ad-native v1.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
