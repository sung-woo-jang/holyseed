import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { labApi } from '../../lib/lab-api';
import { saveLabTokens } from '../../lib/lab-storage';
import { useLabAuthStore } from '../../stores/labAuth.store';
import { useAppModeStore } from '../../stores/appMode.store';
import { useTheme } from '../../lib/theme';
import TossEmoji from '../../components/common/TossEmoji';
import Loader from '../../components/ui/Loader';
import { TE } from '../../lib/toss-emoji';

export default function LabLoginScreen() {
  const theme = useTheme();
  const setAuth = useLabAuthStore((s) => s.setAuth);
  const switchMode = useAppModeStore((s) => s.switchMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [logging, setLogging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setLogging(true);
    setError(null);
    try {
      const { data: res } = await labApi.post('/auth/login', { email, password });
      const payload = res.data ?? res;
      await saveLabTokens(payload.accessToken, payload.refreshToken);
      setAuth({ accessToken: payload.accessToken, refreshToken: payload.refreshToken }, payload.user);
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? '로그인에 실패했어요.';
      setError(msg);
    } finally {
      setLogging(false);
    }
  }

  return (
    <KeyboardAvoidingView style={[styles.screen, { backgroundColor: theme.bg }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.logoArea}>
          <View style={[styles.logoBox, { backgroundColor: theme.brandSoft }]}>
            <TossEmoji code={TE.gamepad} size={44} />
          </View>
          <Text style={[styles.appName, { color: theme.text }]}>Lab 모드</Text>
          <Text style={[styles.appDesc, { color: theme.textMuted }]}>
            라오어 · TQQQ VR · 근무일지{'\n'}lab 계정으로 로그인하세요
          </Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
            placeholder="이메일"
            placeholderTextColor={theme.textMuted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
          />
          <TextInput
            style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
            placeholder="비밀번호"
            placeholderTextColor={theme.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="current-password"
          />
        </View>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <Pressable
          style={[styles.submitBtn, { backgroundColor: theme.brand, opacity: logging ? 0.7 : 1 }]}
          onPress={handleSubmit}
          disabled={logging || !email || !password}
        >
          {logging ? <Loader color="#fff" /> : <Text style={styles.submitBtnText}>로그인</Text>}
        </Pressable>

        <Pressable style={styles.backRow} onPress={() => switchMode('assetDiary')}>
          <Text style={[styles.backText, { color: theme.textMuted }]}>← 자산일기로 돌아가기</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logoArea: { alignItems: 'center', marginBottom: 32 },
  logoBox: { width: 72, height: 72, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  appName: { fontSize: 22, fontWeight: '800', marginBottom: 6 },
  appDesc: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  form: { gap: 10 },
  input: { height: 52, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, fontSize: 15 },
  errorBox: { marginTop: 12 },
  errorText: { color: '#FF3B30', fontSize: 13 },
  submitBtn: { height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  backRow: { alignItems: 'center', marginTop: 24 },
  backText: { fontSize: 13, fontWeight: '600' },
});
