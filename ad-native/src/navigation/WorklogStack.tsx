import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LabWorklogScreen from '../screens/lab/worklog/LabWorklogScreen';
import WorklogSettlementScreen from '../screens/lab/worklog/WorklogSettlementScreen';

export type WorklogStackParamList = {
  WorklogHome: undefined;
  WorklogSettlement: undefined;
};

const Stack = createNativeStackNavigator<WorklogStackParamList>();

export default function WorklogStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="WorklogHome" component={LabWorklogScreen} options={{ headerShown: false }} />
      <Stack.Screen name="WorklogSettlement" component={WorklogSettlementScreen} options={{ title: '월급 정산' }} />
    </Stack.Navigator>
  );
}
