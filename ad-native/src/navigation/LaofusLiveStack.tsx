import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LaofusLiveScreen from '../screens/laofus/LaofusLiveScreen';

export type LaofusLiveStackParamList = {
  LaofusLive: undefined;
};

const Stack = createNativeStackNavigator<LaofusLiveStackParamList>();

export default function LaofusLiveStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="LaofusLive" component={LaofusLiveScreen} options={{ title: '시세' }} />
    </Stack.Navigator>
  );
}
