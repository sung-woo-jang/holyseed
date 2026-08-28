import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TossEmoji from '../components/common/TossEmoji';
import WorklogStack from './WorklogStack';
import AppMoreScreen from '../screens/AppMoreScreen';
import { useTheme } from '../lib/theme';
import { TE } from '../lib/toss-emoji';

export type WorklogTabParamList = {
  Worklog: undefined;
  More: undefined;
};

const Tab = createBottomTabNavigator<WorklogTabParamList>();
const BASE_TAB_BAR_HEIGHT = 52;

/** "근무일지" 앱 — 트레이딩 도구와 무관한 독립 도구로 분리 */
export default function WorklogRootTabNavigator() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarHeight = BASE_TAB_BAR_HEIGHT + insets.bottom;

  return (
    <Tab.Navigator
      initialRouteName="Worklog"
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
        name="Worklog"
        component={WorklogStack}
        options={{ tabBarLabel: '근무일지', tabBarIcon: ({ size }) => <TossEmoji code={TE.briefcase} size={size} /> }}
      />
      <Tab.Screen name="More" options={{ tabBarLabel: '더보기', tabBarIcon: ({ size }) => <TossEmoji code={TE.gear} size={size} /> }}>
        {() => <AppMoreScreen appName="근무일지" />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}
