import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LaofusHomeScreen from '../screens/lab/laofus/LaofusHomeScreen';
import LaofusSystemScreen from '../screens/lab/laofus/LaofusSystemScreen';

export type LaofusStackParamList = {
  LaofusHome: undefined;
  LaofusSystem: undefined;
};

const Stack = createNativeStackNavigator<LaofusStackParamList>();

export default function LaofusStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="LaofusHome" component={LaofusHomeScreen} options={{ title: '라오어' }} />
      <Stack.Screen name="LaofusSystem" component={LaofusSystemScreen} options={{ title: '엔진 상태 · 이벤트' }} />
    </Stack.Navigator>
  );
}
