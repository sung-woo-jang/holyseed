import { appLogin } from '@apps-in-toss/framework';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { api } from '../lib/api';
import { clearTokens, getTokens, saveTokens } from '../lib/storage';
import { useAuthStore } from '../stores/auth.store';

interface AuthBootstrapProps {
  children: React.ReactNode;
}

export default function AuthBootstrap({ children }: AuthBootstrapProps) {
  const { isReady, isAuthenticated, setAuth, setReady, setHouseholds } = useAuthStore();

  useEffect(() => {
    boot();
  }, []);

  async function boot() {
    try {
      const { accessToken, refreshToken } = await getTokens();

      if (accessToken && refreshToken) {
        const { data: userData } = await api.get('/users/me', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setAuth({ accessToken, refreshToken }, userData.data ?? userData);
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
      const { authorizationCode, referrer } = await appLogin();
      const { data } = await api.post('/auth/app-login', { authorizationCode, referrer });
      const payload = data.data ?? data;

      await saveTokens(payload.accessToken, payload.refreshToken);
      setAuth(
        { accessToken: payload.accessToken, refreshToken: payload.refreshToken },
        payload.user,
      );
      await loadHouseholds();
    } catch {
      await clearTokens();
    } finally {
      setReady();
    }
  }

  async function loadHouseholds() {
    try {
      const { data } = await api.get('/households');
      const list = data.data ?? data;
      setHouseholds(list);
    } catch {
      // 가구 없음 — 온보딩에서 생성
    }
  }

  if (!isReady) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#3182F6" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
