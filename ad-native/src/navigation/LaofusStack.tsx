import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LaofusHomeScreen from '../screens/lab/laofus/LaofusHomeScreen';
import LaofusSystemScreen from '../screens/lab/laofus/LaofusSystemScreen';
import LaofusCyclesScreen from '../screens/lab/laofus/LaofusCyclesScreen';
import LaofusCycleDetailScreen from '../screens/lab/laofus/LaofusCycleDetailScreen';
import LaofusWealthScreen from '../screens/lab/laofus/LaofusWealthScreen';

export type LaofusStackParamList = {
  LaofusHome: undefined;
  LaofusSystem: undefined;
  LaofusCycles: undefined;
  LaofusCycleDetail: { cycleNo: number };
  LaofusWealth: undefined;
};

const Stack = createNativeStackNavigator<LaofusStackParamList>();

export default function LaofusStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="LaofusHome" component={LaofusHomeScreen} options={{ title: '라오어' }} />
      <Stack.Screen name="LaofusSystem" component={LaofusSystemScreen} options={{ title: '엔진 상태 · 이벤트' }} />
      <Stack.Screen name="LaofusCycles" component={LaofusCyclesScreen} options={{ title: '사이클 기록' }} />
      <Stack.Screen name="LaofusCycleDetail" component={LaofusCycleDetailScreen} options={{ title: '사이클 상세' }} />
      <Stack.Screen name="LaofusWealth" component={LaofusWealthScreen} options={{ title: '실계좌 자산' }} />
    </Stack.Navigator>
  );
}
