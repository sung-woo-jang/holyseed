import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { labApi } from '../lib/lab-api';
import { getLabTokens } from '../lib/lab-storage';
import { useLabAuthStore } from '../stores/labAuth.store';
import { useTheme } from '../lib/theme';
import Loader from '../components/ui/Loader';
import LabLoginScreen from '../screens/lab/LabLoginScreen';
import LabMainTabNavigator from './LabMainTabNavigator';

async function restoreLabSession() {
  try {
    const { accessToken, refreshToken } = await getLabTokens();
    if (accessToken && refreshToken) {
      const { data: res } = await labApi.get('/users/me', { headers: { Authorization: `Bearer ${accessToken}` } });
      useLabAuthStore.getState().setAuth({ accessToken, refreshToken }, res.data ?? res);
    }
  } catch {
    // 토큰 만료 등 → 로그인 화면으로
  } finally {
    useLabAuthStore.getState().setReady();
  }
}

export default function LabRootNavigator() {
  const theme = useTheme();
  const { isReady, isAuthenticated } = useLabAuthStore();

  useEffect(() => {
    restoreLabSession();
  }, []);

  if (!isReady) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.bg }]}>
        <Loader size="large" color={theme.brand} />
      </View>
    );
  }

  if (!isAuthenticated) return <LabLoginScreen />;
  return <LabMainTabNavigator />;
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
