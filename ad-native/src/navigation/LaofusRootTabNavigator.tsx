import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TossEmoji from '../components/common/TossEmoji';
import LaofusStack from './LaofusStack';
import VrStack from './VrStack';
import AppLauncherScreen from '../screens/AppLauncherScreen';
import { useTheme } from '../lib/theme';
import { TE } from '../lib/toss-emoji';

export type LaofusTabParamList = {
  Laofus: undefined;
  Vr: undefined;
  Apps: undefined;
};

const Tab = createBottomTabNavigator<LaofusTabParamList>();
const BASE_TAB_BAR_HEIGHT = 52;

/** "라오어" 앱 — 무매(무한매수법)와 TQQQ VR을 한 탭바 안에 묶은 트레이딩 도구 묶음 */
export default function LaofusRootTabNavigator() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarHeight = BASE_TAB_BAR_HEIGHT + insets.bottom;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.brand,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopColor: theme.border,
          height: tabBarHeight,
          paddingBottom: insets.bottom,
          paddingTop: 6,
        },
      }}
    >
      <Tab.Screen
        name="Laofus"
        component={LaofusStack}
        options={{ tabBarLabel: '무매', tabBarIcon: ({ size }) => <TossEmoji code={TE.chartUp} size={size} /> }}
      />
      <Tab.Screen
        name="Vr"
        component={VrStack}
        options={{ tabBarLabel: 'VR', tabBarIcon: ({ size }) => <TossEmoji code={TE.chartBar} size={size} /> }}
      />
      <Tab.Screen
        name="Apps"
        component={AppLauncherScreen}
        options={{ tabBarLabel: '앱', tabBarIcon: ({ size }) => <TossEmoji code={TE.repeat} size={size} /> }}
      />
    </Tab.Navigator>
  );
}
