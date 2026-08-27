import { createNativeStackNavigator } from '@react-navigation/native-stack';
import VrOverviewScreen from '../screens/lab/vr/VrOverviewScreen';
import VrFillsScreen from '../screens/lab/vr/VrFillsScreen';
import VrLadderScreen from '../screens/lab/vr/VrLadderScreen';
import VrTrendScreen from '../screens/lab/vr/VrTrendScreen';
import VrSystemScreen from '../screens/lab/vr/VrSystemScreen';
import VrTabBar from './VrTabBar';

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
    <Stack.Navigator screenOptions={{ header: (props) => <VrTabBar {...props} /> }}>
      <Stack.Screen name="VrOverview" component={VrOverviewScreen} />
      <Stack.Screen name="VrFills" component={VrFillsScreen} />
      <Stack.Screen name="VrLadder" component={VrLadderScreen} />
      <Stack.Screen name="VrTrend" component={VrTrendScreen} />
      <Stack.Screen name="VrSystem" component={VrSystemScreen} />
    </Stack.Navigator>
  );
}
