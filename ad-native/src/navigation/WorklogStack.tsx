import { createNativeStackNavigator } from '@react-navigation/native-stack';
import WorklogHomeScreen from '../screens/worklog/WorklogHomeScreen';
import WorklogEntryScreen from '../screens/worklog/WorklogEntryScreen';
import WorklogSettlementScreen from '../screens/worklog/WorklogSettlementScreen';
import WorklogCategoryScreen from '../screens/worklog/WorklogCategoryScreen';
import WorklogScheduleScreen from '../screens/worklog/WorklogScheduleScreen';
import type { WorklogRecord } from '../api/worklog';

export type WorklogStackParamList = {
  WorklogHome: { savedMode?: 'create' | 'edit' | 'delete'; savedAt?: number } | undefined;
  WorklogEntry: { record: WorklogRecord | null; defaultDate: string };
  WorklogSettlement: undefined;
  WorklogCategory: undefined;
  WorklogSchedule: undefined;
};

const Stack = createNativeStackNavigator<WorklogStackParamList>();

export default function WorklogStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="WorklogHome" component={WorklogHomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="WorklogEntry" component={WorklogEntryScreen} options={{ title: '근무 기록' }} />
      <Stack.Screen name="WorklogSettlement" component={WorklogSettlementScreen} options={{ title: '수령 처리' }} />
      <Stack.Screen name="WorklogCategory" component={WorklogCategoryScreen} options={{ title: '분류/업무 관리' }} />
      <Stack.Screen name="WorklogSchedule" component={WorklogScheduleScreen} options={{ title: '예정 근무일 등록' }} />
    </Stack.Navigator>
  );
}
