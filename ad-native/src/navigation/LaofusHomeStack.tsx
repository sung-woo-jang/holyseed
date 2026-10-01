import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LaofusLiveScreen from '../screens/laofus/LaofusLiveScreen';
import LaofusWealthScreen from '../screens/laofus/LaofusWealthScreen';
import LaofusAssetTrendScreen from '../screens/laofus/LaofusAssetTrendScreen';

export type LaofusHomeStackParamList = {
  LaofusLive: undefined;
  LaofusWealth: undefined;
  LaofusAssetTrend: undefined;
};

const Stack = createNativeStackNavigator<LaofusHomeStackParamList>();

/** "홈" 탭 — 총 자산·3종목 시세·걸린 주문, 그리고 계좌 단위 화면(실계좌 자산, 자산 추이) */
export default function LaofusHomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="LaofusLive" component={LaofusLiveScreen} options={{ title: '홈' }} />
      <Stack.Screen name="LaofusWealth" component={LaofusWealthScreen} options={{ title: '실계좌 자산' }} />
      <Stack.Screen name="LaofusAssetTrend" component={LaofusAssetTrendScreen} options={{ title: '자산 추이' }} />
    </Stack.Navigator>
  );
}
