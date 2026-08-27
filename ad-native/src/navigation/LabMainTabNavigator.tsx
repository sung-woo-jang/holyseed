import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TossEmoji from '../components/common/TossEmoji';
import LaofusPlaceholderScreen from '../screens/lab/LaofusPlaceholderScreen';
import VrPlaceholderScreen from '../screens/lab/VrPlaceholderScreen';
import LabWorklogScreen from '../screens/lab/worklog/LabWorklogScreen';
import LabMoreScreen from '../screens/lab/LabMoreScreen';
import { useTheme } from '../lib/theme';
import { TE } from '../lib/toss-emoji';

export type LabTabParamList = {
  Laofus: undefined;
  Vr: undefined;
  Worklog: undefined;
  LabMore: undefined;
};

const Tab = createBottomTabNavigator<LabTabParamList>();
const BASE_TAB_BAR_HEIGHT = 52;

export default function LabMainTabNavigator() {
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
        component={LaofusPlaceholderScreen}
        options={{ tabBarLabel: '라오어', tabBarIcon: ({ size }) => <TossEmoji code={TE.chartUp} size={size} /> }}
      />
      <Tab.Screen
        name="Vr"
        component={VrPlaceholderScreen}
        options={{ tabBarLabel: 'VR', tabBarIcon: ({ size }) => <TossEmoji code={TE.chartBar} size={size} /> }}
      />
      <Tab.Screen
        name="Worklog"
        component={LabWorklogScreen}
        options={{ tabBarLabel: '근무일지', tabBarIcon: ({ size }) => <TossEmoji code={TE.briefcase} size={size} /> }}
      />
      <Tab.Screen
        name="LabMore"
        component={LabMoreScreen}
        options={{ tabBarLabel: '더보기', tabBarIcon: ({ size }) => <TossEmoji code={TE.gear} size={size} /> }}
      />
    </Tab.Navigator>
  );
}
