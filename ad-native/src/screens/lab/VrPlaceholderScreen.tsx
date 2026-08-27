import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import EmptyState from '../../components/common/EmptyState';
import { useTheme } from '../../lib/theme';
import { TE } from '../../lib/toss-emoji';

export default function VrPlaceholderScreen() {
  const theme = useTheme();
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg }}>
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <EmptyState iconCode={TE.chartBar} title="TQQQ VR 대시보드 준비 중" desc="다음 단계에서 이식할 예정이에요" />
      </View>
    </SafeAreaView>
  );
}
