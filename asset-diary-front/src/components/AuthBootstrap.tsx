import { Storage, appLogin } from '@apps-in-toss/framework';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { api } from '../lib/api';
import { saveTokens } from '../lib/storage';
import { useAuthStore } from '../stores/auth.store';

interface AuthBootstrapProps {
  children: React.ReactNode;
}

export default function AuthBootstrap({ children }: AuthBootstrapProps) {
  const { isReady, isAuthenticated, setAuth, setReady, setHouseholds } = useAuthStore();
  const [logging, setLogging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    restoreSession();
  }, []);

  async function restoreSession() {
    try {
      const accessToken = await Storage.getItem('@ad:accessToken');
      const refreshToken = await Storage.getItem('@ad:refreshToken');

      if (accessToken && refreshToken) {
        const { data: res } = await api.get('/users/me', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setAuth({ accessToken, refreshToken }, res.data ?? res);
        await loadHouseholds();
      }
    } catch {
      // 토큰 만료 등 → 로그인 화면 표시
    } finally {
      setReady();
    }
  }

  async function handleLogin() {
    setLogging(true);
    setError(null);
    try {
      let authorizationCode = 'dev-user-001';
      let referrer: 'DEFAULT' | 'SANDBOX' = 'SANDBOX';

      try {
        const result = await appLogin();
        authorizationCode = result.authorizationCode;
        referrer = result.referrer;
      } catch {
        // 샌드박스 외 환경(로컬 개발) fallback
      }

      const { data: res } = await api.post('/auth/app-login', { authorizationCode, referrer });
      const payload = res.data ?? res;

      await saveTokens(payload.accessToken, payload.refreshToken);
      setAuth(
        { accessToken: payload.accessToken, refreshToken: payload.refreshToken },
        payload.user,
      );
      await loadHouseholds();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(`로그인에 실패했어요.\n${msg}`);
    } finally {
      setLogging(false);
    }
  }

  async function loadHouseholds() {
    try {
      const { data: res } = await api.get('/households');
      setHouseholds(res.data ?? res);
    } catch {
      // 가구 없음 → 온보딩에서 생성
    }
  }

  if (!isReady) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3182F6" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.screen}>
        <View style={styles.logoArea}>
          <View style={styles.logoBox}>
            <Text style={styles.logoEmoji}>📒</Text>
          </View>
          <Text style={styles.appName}>자산일기</Text>
          <Text style={styles.appDesc}>
            우리 가족의 자산을{'\n'}함께 기록하고 관리해요
          </Text>
        </View>

        <View style={styles.bottomArea}>
          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          <TouchableOpacity
            style={[styles.loginBtn, logging && styles.loginBtnDisabled]}
            onPress={handleLogin}
            disabled={logging}
            activeOpacity={0.85}
          >
            {logging ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginBtnText}>토스로 로그인</Text>
            )}
          </TouchableOpacity>
          <Text style={styles.loginNote}>
            로그인 시 자산일기 이용약관 및{'\n'}개인정보 처리방침에 동의하게 됩니다
          </Text>
        </View>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  screen: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 120,
    paddingBottom: 52,
  },
  logoArea: {
    alignItems: 'center',
    gap: 12,
  },
  logoBox: {
    width: 80,
    height: 80,
    borderRadius: 22,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  logoEmoji: { fontSize: 38 },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#191F28',
    letterSpacing: -0.5,
  },
  appDesc: {
    fontSize: 16,
    color: '#8B95A1',
    textAlign: 'center',
    lineHeight: 24,
    marginTop: 4,
  },
  bottomArea: { gap: 14 },
  errorBox: {
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 14,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  loginBtn: {
    backgroundColor: '#3182F6',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
  },
  loginBtnDisabled: { opacity: 0.6 },
  loginBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  loginNote: {
    fontSize: 12,
    color: '#B0B8C1',
    textAlign: 'center',
    lineHeight: 18,
  },
});
