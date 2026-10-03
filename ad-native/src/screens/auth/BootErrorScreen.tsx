import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Button from '../../components/ui/Button';
import { retryBoot } from '../../lib/auth-bootstrap';
import { useTheme } from '../../lib/theme';

/** 앱을 켰는데 서버에 닿지 못했을 때 — 로그인 화면이나 "가구 만들기"로 잘못 보내지 않고 다시 시도하게 한다 */
export default function BootErrorScreen() {
  const theme = useTheme();
  const [retrying, setRetrying] = useState(false);

  async function handleRetry() {
    setRetrying(true);
    try {
      await retryBoot();
    } finally {
      setRetrying(false);
    }
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]}>
      <Text style={[styles.title, { color: theme.text }]}>서버에 연결하지 못했어요</Text>
      <Text style={[styles.desc, { color: theme.textMuted }]}>
        인터넷 연결을 확인하고 다시 시도해 주세요.{'\n'}로그인 정보는 그대로 남아 있어요.
      </Text>
      <View style={{ marginTop: 20, alignSelf: 'stretch' }}>
        <Button display="full" size="big" type="primary" loading={retrying} onPress={handleRetry}>
          다시 시도
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  title: { fontSize: 18, fontWeight: '800', marginBottom: 8 },
  desc: { fontSize: 13.5, lineHeight: 20, textAlign: 'center' },
});
