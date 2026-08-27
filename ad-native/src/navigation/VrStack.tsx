import { createNativeStackNavigator } from '@react-navigation/native-stack';
import VrOverviewScreen from '../screens/lab/vr/VrOverviewScreen';
import VrFillsScreen from '../screens/lab/vr/VrFillsScreen';
import VrLadderScreen from '../screens/lab/vr/VrLadderScreen';
import VrTrendScreen from '../screens/lab/vr/VrTrendScreen';
import VrSystemScreen from '../screens/lab/vr/VrSystemScreen';

export type VrStackParamList = {
  VrOverview: undefined;
  VrFills: undefined;
  VrLadder: undefined;
  VrTrend: undefined;
  VrSystem: undefined;
};

const Stack = createNativeStackNavigator<VrStackParamList>();

export default function VrStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="VrOverview" component={VrOverviewScreen} options={{ title: 'TQQQ VR' }} />
      <Stack.Screen name="VrFills" component={VrFillsScreen} options={{ title: '체결 내역' }} />
      <Stack.Screen name="VrLadder" component={VrLadderScreen} options={{ title: '사다리' }} />
      <Stack.Screen name="VrTrend" component={VrTrendScreen} options={{ title: '추이' }} />
      <Stack.Screen name="VrSystem" component={VrSystemScreen} options={{ title: '시스템' }} />
    </Stack.Navigator>
  );
}
