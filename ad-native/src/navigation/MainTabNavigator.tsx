import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import PlaceholderTabScreen from '../screens/PlaceholderTabScreen';
import { useTheme } from '../lib/theme';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabNavigator() {
  const theme = useTheme();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.brand,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarStyle: { backgroundColor: theme.card, borderTopColor: theme.border },
      }}
    >
      <Tab.Screen name="Home" options={{ tabBarLabel: '홈' }}>
        {() => <PlaceholderTabScreen title="홈" />}
      </Tab.Screen>
      <Tab.Screen name="Assets" options={{ tabBarLabel: '자산' }}>
        {() => <PlaceholderTabScreen title="자산" />}
      </Tab.Screen>
      <Tab.Screen name="Book" options={{ tabBarLabel: '거래장부' }}>
        {() => <PlaceholderTabScreen title="거래장부" />}
      </Tab.Screen>
      <Tab.Screen name="More" options={{ tabBarLabel: '더보기' }}>
        {() => <PlaceholderTabScreen title="더보기" />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}
