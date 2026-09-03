import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LabWorklogScreen from '../screens/lab/worklog/LabWorklogScreen';
import WorklogSettlementScreen from '../screens/lab/worklog/WorklogSettlementScreen';
import WorklogCategoryScreen from '../screens/lab/worklog/WorklogCategoryScreen';
import WorklogScheduleScreen from '../screens/lab/worklog/WorklogScheduleScreen';

export type WorklogStackParamList = {
  WorklogHome: undefined;
  WorklogSettlement: undefined;
  WorklogCategory: undefined;
  WorklogSchedule: undefined;
};

const Stack = createNativeStackNavigator<WorklogStackParamList>();

export default function WorklogStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="WorklogHome" component={LabWorklogScreen} options={{ headerShown: false }} />
      <Stack.Screen name="WorklogSettlement" component={WorklogSettlementScreen} options={{ title: '월급 정산' }} />
      <Stack.Screen name="WorklogCategory" component={WorklogCategoryScreen} options={{ title: '분류/업무 관리' }} />
      <Stack.Screen name="WorklogSchedule" component={WorklogScheduleScreen} options={{ title: '예정 근무일 등록' }} />
    </Stack.Navigator>
  );
}
