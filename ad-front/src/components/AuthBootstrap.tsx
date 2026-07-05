import React, { useEffect } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { api } from '../lib/api';
import { getTokens } from '../lib/storage';
import { useAuthStore } from '../stores/auth.store';
import Loader from './ui/Loader';

const PUBLIC_PATHS = ['/login', '/register'];

export async function loadHouseholds() {
  try {
    const { data: res } = await api.get('/households');
    useAuthStore.getState().setHouseholds(res.data ?? res);
  } catch {
    // 가구 없음 → 온보딩에서 생성
  }
}

export default function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const { isReady, isAuthenticated, setAuth, setReady } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    restoreSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function restoreSession() {
    try {
      const { accessToken, refreshToken } = await getTokens();

      if (accessToken && refreshToken) {
        const { data: res } = await api.get('/users/me', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setAuth({ accessToken, refreshToken }, res.data ?? res);
        await loadHouseholds();
      }
    } catch {
      // 토큰 만료 등 → 로그인 화면으로
    } finally {
      setReady();
    }
  }

  if (!isReady) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader size="large" />
      </div>
    );
  }

  const isPublic = PUBLIC_PATHS.includes(location.pathname);

  if (!isAuthenticated && !isPublic) {
    return <Navigate to="/login" replace />;
  }
  if (isAuthenticated && isPublic) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
