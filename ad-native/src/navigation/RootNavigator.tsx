import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { api } from '../lib/api';
import { getTokens } from '../lib/storage';
import { loadHouseholds } from '../lib/auth-bootstrap';
import { useAuthStore } from '../stores/auth.store';
import { useAppModeStore } from '../stores/appMode.store';
import { useTheme } from '../lib/theme';
import Loader from '../components/ui/Loader';
import AuthNavigator from './AuthNavigator';
import MainTabNavigator from './MainTabNavigator';
import LaofusRootTabNavigator from './LaofusRootTabNavigator';
import WorklogRootTabNavigator from './WorklogRootTabNavigator';
import OnboardingScreen from '../screens/auth/OnboardingScreen';
import { navigationRef } from './navigationRef';

async function restoreSession() {
  try {
    const { accessToken, refreshToken } = await getTokens();
    if (accessToken && refreshToken) {
      const { data: res } = await api.get('/users/me', { headers: { Authorization: `Bearer ${accessToken}` } });
      useAuthStore.getState().setAuth({ accessToken, refreshToken }, res.data ?? res);
      await loadHouseholds();
    }
  } catch {
    // 토큰 만료 등 → 로그인 화면으로
  } finally {
    useAuthStore.getState().setReady();
  }
}

export default function RootNavigator() {
  const theme = useTheme();
  const { isReady, isAuthenticated, currentHousehold } = useAuthStore();
  const { isReady: modeReady, mode, restore: restoreAppMode } = useAppModeStore();

  useEffect(() => {
    restoreSession();
    restoreAppMode();
  }, []);

  // 앱 모드 전환 = 완전히 다른 최상위 탭 내비게이터로 리마운트되는 구조인데, 리마운트 시 항상
  // 그 탭바의 첫 탭(메인 화면)에 포커스되어야 한다는 기대와 달리 기기에서 다른 탭에 머무는 경우가
  // 있어(정확한 라이브러리/리마운트 타이밍 원인은 특정 못함), initialRouteName만으로는 불충분해서
  // 모드가 바뀔 때마다 확실하게 그 탭으로 명령형 이동시켜 보정한다.
  useEffect(() => {
    if (!modeReady) return;
    let target: string | null = null;
    if (mode === 'laofus') target = 'Laofus';
    else if (mode === 'worklog') target = 'Worklog';
    else if (mode === 'assetDiary' && isAuthenticated && currentHousehold) target = 'Home';
    if (!target) return;
    const id = setTimeout(() => {
      if (navigationRef.isReady()) navigationRef.navigate(target as never);
    }, 0);
    return () => clearTimeout(id);
  }, [mode, modeReady, isAuthenticated, currentHousehold]);

  if (!isReady || !modeReady) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.bg }]}>
        <Loader size="large" color={theme.brand} />
      </View>
    );
  }

  if (mode === 'laofus') return <LaofusRootTabNavigator />;
  if (mode === 'worklog') return <WorklogRootTabNavigator />;

  if (!isAuthenticated) return <AuthNavigator />;
  if (!currentHousehold) return <OnboardingScreen />;
  return <MainTabNavigator />;
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
