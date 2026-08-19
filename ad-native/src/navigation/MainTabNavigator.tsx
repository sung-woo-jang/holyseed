import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeScreen from '../screens/HomeScreen';
import BookScreen from '../screens/BookScreen';
import AssetsStack from './AssetsStack';
import MoreStack from './MoreStack';
import { Icon } from '../components/common/Icon';
import { useTheme } from '../lib/theme';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();
const BASE_TAB_BAR_HEIGHT = 52;

export default function MainTabNavigator() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.brand,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopColor: theme.border,
          height: BASE_TAB_BAR_HEIGHT + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 6,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: '홈', tabBarIcon: ({ color, size }) => Icon.home(color, size) }}
      />
      <Tab.Screen
        name="Assets"
        component={AssetsStack}
        options={{ tabBarLabel: '자산', tabBarIcon: ({ color, size }) => Icon.wallet(color, size) }}
      />
      <Tab.Screen
        name="Book"
        component={BookScreen}
        options={{ tabBarLabel: '거래장부', tabBarIcon: ({ color, size }) => Icon.book(color, size) }}
      />
      <Tab.Screen
        name="More"
        component={MoreStack}
        options={{ tabBarLabel: '더보기', tabBarIcon: ({ color, size }) => Icon.more(color, size) }}
      />
    </Tab.Navigator>
  );
}
