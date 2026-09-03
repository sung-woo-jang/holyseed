import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { api, BASE_URL } from '../../lib/api';
import { saveTokens } from '../../lib/storage';
import { loadHouseholds } from '../../lib/auth-bootstrap';
import { useAuthStore } from '../../stores/auth.store';
import { useTheme } from '../../lib/theme';
import TossEmoji from '../../components/common/TossEmoji';
import Loader from '../../components/ui/Loader';
import { TE } from '../../lib/toss-emoji';
import type { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({ navigation, route }: Props) {
  const theme = useTheme();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [logging, setLogging] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    route.params?.error === 'oauth' ? '소셜 로그인에 실패했어요. 다시 시도해 주세요.' : null,
  );

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    setError(null);
    try {
      // Expo Go에서는 세션마다 exp:// 주소가 달라져서 고정 스킴으로 못 돌려보내므로,
      // 지금 이 세션의 실제 딥링크 주소를 백엔드에 알려주고 그대로 돌려받는다.
      const redirectUrl = Linking.createURL('auth/callback');
      const authUrl = `${BASE_URL}/auth/google?platform=app&redirectUri=${encodeURIComponent(redirectUrl)}`;

      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);
      if (result.type !== 'success') return;

      const { queryParams } = Linking.parse(result.url);
      if (queryParams?.error) {
        setError('소셜 로그인에 실패했어요. 다시 시도해 주세요.');
        return;
      }
      const accessToken = queryParams?.accessToken as string | undefined;
      const refreshToken = queryParams?.refreshToken as string | undefined;
      if (!accessToken || !refreshToken) {
        setError('소셜 로그인에 실패했어요. 다시 시도해 주세요.');
        return;
      }

      const { data: res } = await api.get('/users/me', { headers: { Authorization: `Bearer ${accessToken}` } });
      await saveTokens(accessToken, refreshToken);
      setAuth({ accessToken, refreshToken }, res.data ?? res);
      await loadHouseholds();
    } catch {
      setError('소셜 로그인에 실패했어요. 다시 시도해 주세요.');
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleSubmit() {
    setLogging(true);
    setError(null);
    try {
      const { data: res } = await api.post('/auth/login', { email, password });
      const payload = res.data ?? res;

      await saveTokens(payload.accessToken, payload.refreshToken);
      setAuth({ accessToken: payload.accessToken, refreshToken: payload.refreshToken }, payload.user);
      await loadHouseholds();
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? '로그인에 실패했어요.';
      setError(msg);
    } finally {
      setLogging(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: theme.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.logoArea}>
          <View style={[styles.logoBox, { backgroundColor: theme.brandSoft }]}>
            <TossEmoji code={TE.ledger} size={44} />
          </View>
          <Text style={[styles.appName, { color: theme.text }]}>자산일기</Text>
          <Text style={[styles.appDesc, { color: theme.textMuted }]}>
            우리 가족의 자산을{'\n'}함께 기록하고 관리해요
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

        <View style={styles.dividerRow}>
          <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
          <Text style={[styles.dividerText, { color: theme.textMuted }]}>또는</Text>
          <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
        </View>

        <Pressable
          style={[styles.googleBtn, { backgroundColor: theme.card, borderColor: theme.border, opacity: googleLoading ? 0.7 : 1 }]}
          onPress={handleGoogleLogin}
          disabled={googleLoading}
        >
          {googleLoading ? <Loader /> : <Text style={[styles.googleBtnText, { color: theme.text }]}>구글로 계속하기</Text>}
        </Pressable>

        <View style={styles.switchRow}>
          <Text style={[styles.switchText, { color: theme.textMuted }]}>아직 계정이 없나요? </Text>
          <Pressable onPress={() => navigation.navigate('Register')}>
            <Text style={[styles.switchLink, { color: theme.brand }]}>회원가입</Text>
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
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginTop: 24, marginBottom: 16, gap: 10 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 12 },
  googleBtn: { height: 52, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  googleBtnText: { fontSize: 15, fontWeight: '600' },
  switchRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  switchText: { fontSize: 13 },
  switchLink: { fontSize: 13, fontWeight: '700' },
});
