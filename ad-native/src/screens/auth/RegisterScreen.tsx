import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { api } from '../../lib/api';
import { saveTokens } from '../../lib/storage';
import { useAuthStore } from '../../stores/auth.store';
import { useTheme } from '../../lib/theme';
import TossEmoji from '../../components/common/TossEmoji';
import Loader from '../../components/ui/Loader';
import { TE } from '../../lib/toss-emoji';
import type { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export default function RegisterScreen({ navigation }: Props) {
  const theme = useTheme();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const { data: res } = await api.post('/auth/register', {
        email,
        password,
        name: name || undefined,
      });
      const payload = res.data ?? res;

      await saveTokens(payload.accessToken, payload.refreshToken);
      setAuth({ accessToken: payload.accessToken, refreshToken: payload.refreshToken }, payload.user);
      // households가 비어 있으면 RootNavigator가 자동으로 온보딩 화면을 띄운다
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? '회원가입에 실패했어요.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: theme.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.logoArea}>
          <View style={[styles.logoBox, { backgroundColor: theme.brandSoft }]}>
            <TossEmoji code={TE.party} size={44} />
          </View>
          <Text style={[styles.appName, { color: theme.text }]}>회원가입</Text>
          <Text style={[styles.appDesc, { color: theme.textMuted }]}>
            자산일기와 함께{'\n'}기록을 시작해요
          </Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
            placeholder="이름 (선택)"
            placeholderTextColor={theme.textMuted}
            value={name}
            onChangeText={setName}
            autoComplete="name"
          />
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
            placeholder="비밀번호 (6자 이상)"
            placeholderTextColor={theme.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="new-password"
          />
        </View>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <Pressable
          style={[styles.submitBtn, { backgroundColor: theme.brand, opacity: submitting ? 0.7 : 1 }]}
          onPress={handleSubmit}
          disabled={submitting || !email || !password}
        >
          {submitting ? <Loader color="#fff" /> : <Text style={styles.submitBtnText}>가입하기</Text>}
        </Pressable>

        <View style={styles.switchRow}>
          <Text style={[styles.switchText, { color: theme.textMuted }]}>이미 계정이 있나요? </Text>
          <Pressable onPress={() => navigation.navigate('Login')}>
            <Text style={[styles.switchLink, { color: theme.brand }]}>로그인</Text>
          </Pressable>
        </View>
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
  switchRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  switchText: { fontSize: 13 },
  switchLink: { fontSize: 13, fontWeight: '700' },
});
