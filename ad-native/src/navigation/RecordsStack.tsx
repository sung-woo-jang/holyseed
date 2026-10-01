import { createNativeStackNavigator, type NativeStackHeaderProps } from '@react-navigation/native-stack';
import SpacexOverviewScreen from '../screens/spacex/SpacexOverviewScreen';
import SpacexEntriesScreen from '../screens/spacex/SpacexEntriesScreen';
import PillHeader, { type PillTab } from './PillHeader';

export type RecordsStackParamList = {
  SpacexOverview: undefined;
  SpacexEntries: undefined;
};

const TABS: PillTab[] = [
  { name: 'SpacexOverview', label: '개요' },
  { name: 'SpacexEntries', label: '매수 내역' },
];

const Stack = createNativeStackNavigator<RecordsStackParamList>();

/** "기록" 탭 — 스페이스X 전용 (개요 · 매수 내역) */
export default function RecordsStack() {
  return (
    <Stack.Navigator screenOptions={{ header: (props: NativeStackHeaderProps) => <PillHeader {...props} title="기록" tabs={TABS} /> }}>
      <Stack.Screen name="SpacexOverview" component={SpacexOverviewScreen} />
      <Stack.Screen name="SpacexEntries" component={SpacexEntriesScreen} />
    </Stack.Navigator>
  );
}
