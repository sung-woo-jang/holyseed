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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    boot();
  }, []);

  async function boot() {
    setError(null);
    try {
      const accessToken = await Storage.getItem('@ad:accessToken');
      const refreshToken = await Storage.getItem('@ad:refreshToken');

      if (accessToken && refreshToken) {
        const { data: res } = await api.get('/users/me', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setAuth({ accessToken, refreshToken }, res.data ?? res);
        await loadHouseholds();
        setReady();
        return;
      }

      await loginWithToss();
    } catch {
      await loginWithToss();
    }
  }

  async function loginWithToss() {
    try {
      let authorizationCode = 'dev-user-001';
      let referrer: 'DEFAULT' | 'SANDBOX' = 'SANDBOX';

      try {
        const result = await appLogin();
        authorizationCode = result.authorizationCode;
        referrer = result.referrer;
      } catch {
        // appLogin 실패 시 개발 더미 fallback (백엔드 AIT_AD_CLIENT_ID 미설정 시 동작)
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
      setError(`로그인 실패: ${msg}`);
    } finally {
      setReady();
    }
  }

  async function loadHouseholds() {
    try {
      const { data: res } = await api.get('/households');
      setHouseholds(res.data ?? res);
    } catch {
      // 가구 없음 — 온보딩에서 생성
    }
  }

  if (!isReady) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3182F6" />
        <Text style={styles.loadingText}>자산일기 로딩 중...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>로그인이 필요해요</Text>
        {error && <Text style={styles.errorDetail}>{error}</Text>}
        <TouchableOpacity style={styles.retryBtn} onPress={boot}>
          <Text style={styles.retryText}>다시 시도</Text>
        </TouchableOpacity>
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
    padding: 24,
    gap: 12,
  },
  loadingText: { fontSize: 14, color: '#8B95A1' },
  errorTitle: { fontSize: 18, fontWeight: '700', color: '#191F28' },
  errorDetail: { fontSize: 12, color: '#FF3B30', textAlign: 'center', lineHeight: 18 },
  retryBtn: {
    marginTop: 8,
    backgroundColor: '#3182F6',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  retryText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
