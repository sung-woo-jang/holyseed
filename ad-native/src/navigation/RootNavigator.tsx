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
