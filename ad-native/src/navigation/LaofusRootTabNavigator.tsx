import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { NavigatorScreenParams } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TossEmoji from '../components/common/TossEmoji';
import LaofusHomeStack from './LaofusHomeStack';
import StrategyStack, { type StrategyStackParamList } from './StrategyStack';
import RecordsStack, { type RecordsStackParamList } from './RecordsStack';
import AppMoreScreen from '../screens/AppMoreScreen';
import { useTheme } from '../lib/theme';
import { TE } from '../lib/toss-emoji';

export type LaofusTabParamList = {
  Home: undefined;
  Strategy: NavigatorScreenParams<StrategyStackParamList> | undefined;
  Records: NavigatorScreenParams<RecordsStackParamList> | undefined;
  More: undefined;
};

const Tab = createBottomTabNavigator<LaofusTabParamList>();
const BASE_TAB_BAR_HEIGHT = 52;

/** "라오어" 앱 — 홈(총 자산·시세) · 전략(무한매수법·VR) · 모으기(스페이스X·UPRO) · 더보기 */
export default function LaofusRootTabNavigator() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarHeight = BASE_TAB_BAR_HEIGHT + insets.bottom;

  return (
    <Tab.Navigator
      initialRouteName="Home"
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
        name="Home"
        component={LaofusHomeStack}
        options={{ tabBarLabel: '홈', tabBarIcon: ({ size }) => <TossEmoji code={TE.house} size={size} /> }}
      />
      <Tab.Screen
        name="Strategy"
        component={StrategyStack}
        options={{ tabBarLabel: '전략', tabBarIcon: ({ size }) => <TossEmoji code={TE.chartUp} size={size} /> }}
      />
      <Tab.Screen
        name="Records"
        component={RecordsStack}
        options={{ tabBarLabel: '모으기', tabBarIcon: ({ size }) => <TossEmoji code={TE.piggy} size={size} /> }}
      />
      <Tab.Screen name="More" options={{ tabBarLabel: '더보기', tabBarIcon: ({ size }) => <TossEmoji code={TE.gear} size={size} /> }}>
        {() => <AppMoreScreen appName="라오어" />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}
