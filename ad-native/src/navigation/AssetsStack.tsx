import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AssetsScreen from '../screens/AssetsScreen';
import AssetDetailScreen from '../screens/AssetDetailScreen';
import type { AssetsStackParamList } from './types';

const Stack = createNativeStackNavigator<AssetsStackParamList>();

export default function AssetsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="AssetsList" component={AssetsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AssetDetail" component={AssetDetailScreen} options={{ title: '자산 상세' }} />
    </Stack.Navigator>
  );
}
