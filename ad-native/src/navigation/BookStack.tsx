import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BookScreen from '../screens/BookScreen';
import TransactionDetailScreen from '../screens/TransactionDetailScreen';
import type { BookStackParamList } from './types';

const Stack = createNativeStackNavigator<BookStackParamList>();

export default function BookStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="BookHome" component={BookScreen} options={{ headerShown: false }} />
      <Stack.Screen name="TransactionDetail" component={TransactionDetailScreen} options={{ title: '거래 상세' }} />
    </Stack.Navigator>
  );
}
