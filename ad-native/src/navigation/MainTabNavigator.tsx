import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeScreen from '../screens/HomeScreen';
import AssetsStack from './AssetsStack';
import BookStack from './BookStack';
import MoreStack from './MoreStack';
import { Icon } from '../components/common/Icon';
import { useTheme } from '../lib/theme';
import { useSheetStore } from '../stores/sheet.store';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();
const BASE_TAB_BAR_HEIGHT = 52;

export default function MainTabNavigator() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const sheetOpen = useSheetStore((s) => s.openCount > 0);
  const tabBarHeight = BASE_TAB_BAR_HEIGHT + insets.bottom;
  return (
    <View style={{ flex: 1 }}>
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
          component={BookStack}
          options={{ tabBarLabel: '거래장부', tabBarIcon: ({ color, size }) => Icon.book(color, size) }}
        />
        <Tab.Screen
          name="More"
          component={MoreStack}
          options={{ tabBarLabel: '더보기', tabBarIcon: ({ color, size }) => Icon.more(color, size) }}
        />
      </Tab.Navigator>
      {/* Android의 RN Modal은 별도 OS Window라 하단 탭바를 덮지 못하는 업스트림 미해결 한계가 있다
          (statusBarTranslucent/navigationBarTranslucent를 다 줘도 안 고쳐짐). tabBarStyle의
          backgroundColor를 바꾸는 시도는 실제로 반영되지 않아서, 대신 탭바 자리 위에 별도의
          어두운 오버레이 View를 직접 그려서 확실하게 가린다 — src/components/sheets/SheetModal.tsx와 짝. */}
      {sheetOpen && (
        <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: tabBarHeight, backgroundColor: 'rgba(0,0,0,0.42)' }} />
      )}
    </View>
  );
}
