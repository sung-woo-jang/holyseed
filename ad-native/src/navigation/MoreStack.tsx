import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MoreHomeScreen from '../screens/more/MoreHomeScreen';
import CashflowScreen from '../screens/more/CashflowScreen';
import CategoriesScreen from '../screens/more/CategoriesScreen';
import CategoryEditScreen from '../screens/more/CategoryEditScreen';
import CategoryTransactionsScreen from '../screens/more/CategoryTransactionsScreen';
import TransactionDetailScreen from '../screens/TransactionDetailScreen';
import CompareScreen from '../screens/more/CompareScreen';
import MembersScreen from '../screens/more/MembersScreen';
import NetWorthAtScreen from '../screens/more/NetWorthAtScreen';
import SettingsScreen from '../screens/more/SettingsScreen';
import type { MoreStackParamList } from './types';

const Stack = createNativeStackNavigator<MoreStackParamList>();

export default function MoreStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="MoreHome" component={MoreHomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Cashflow" component={CashflowScreen} options={{ title: '현금흐름' }} />
      <Stack.Screen name="Categories" component={CategoriesScreen} options={{ title: '카테고리 관리' }} />
      <Stack.Screen name="CategoryEdit" component={CategoryEditScreen} />
      <Stack.Screen name="CategoryTransactions" component={CategoryTransactionsScreen} />
      <Stack.Screen name="TransactionDetail" component={TransactionDetailScreen} options={{ title: '거래 상세' }} />
      <Stack.Screen name="Compare" component={CompareScreen} options={{ title: '연간 비교' }} />
      <Stack.Screen name="Members" component={MembersScreen} options={{ title: '멤버 관리' }} />
      <Stack.Screen name="NetWorthAt" component={NetWorthAtScreen} options={{ title: '날짜별 자산 조회' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: '설정' }} />
    </Stack.Navigator>
  );
}
