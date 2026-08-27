import { createNativeStackNavigator } from '@react-navigation/native-stack';
import VrOverviewScreen from '../screens/lab/vr/VrOverviewScreen';
import VrFillsScreen from '../screens/lab/vr/VrFillsScreen';

export type VrStackParamList = {
  VrOverview: undefined;
  VrFills: undefined;
};

const Stack = createNativeStackNavigator<VrStackParamList>();

export default function VrStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="VrOverview" component={VrOverviewScreen} options={{ title: 'TQQQ VR' }} />
      <Stack.Screen name="VrFills" component={VrFillsScreen} options={{ title: '체결 내역' }} />
    </Stack.Navigator>
  );
}
