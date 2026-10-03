import { StyleSheet, Text, View } from 'react-native';
import Button from '../ui/Button';
import { useTheme } from '../../lib/theme';

/** 조회가 실패했을 때 "데이터가 없어요" 빈 상태로 오해되지 않게 보여주는 오류 화면 */
export default function QueryError({ onRetry, message }: { onRetry: () => void; message?: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]}>
      <Text style={[styles.title, { color: theme.text }]}>불러오지 못했어요</Text>
      <Text style={[styles.desc, { color: theme.textMuted }]}>{message ?? '서버에 연결할 수 없거나 로그인이 필요해요. 잠시 후 다시 시도해 주세요.'}</Text>
      <View style={{ marginTop: 16 }}>
        <Button size="medium" type="primary" style="weak" onPress={onRetry}>
          다시 시도
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  title: { fontSize: 16, fontWeight: '800', marginBottom: 6 },
  desc: { fontSize: 13, lineHeight: 19, textAlign: 'center' },
});
