import { createNativeStackNavigator, type NativeStackHeaderProps } from '@react-navigation/native-stack';
import DcaHomeScreen from '../screens/spacex/DcaHomeScreen';
import SpacexOverviewScreen from '../screens/spacex/SpacexOverviewScreen';
import SpacexEntriesScreen from '../screens/spacex/SpacexEntriesScreen';
import PillHeader, { type PillTab } from './PillHeader';
import { DCA_SYMBOLS } from '../lib/dca';

export type RecordsStackParamList = {
  DcaHome: undefined;
  SpacexOverview: undefined;
  UproOverview: undefined;
  SpacexEntries: undefined;
};

const TABS: PillTab[] = [
  { name: 'DcaHome', label: '전체' },
  ...DCA_SYMBOLS.map((d) => ({ name: d.route, label: d.label })),
  { name: 'SpacexEntries', label: '매수 내역' },
];

const Stack = createNativeStackNavigator<RecordsStackParamList>();

/** "모으기" 탭 — 토스 주식 모으기로 매일 사는 종목들 (전체 · 종목별 · 매수 내역). 라우트 이름은 처음 스페이스X 전용이던 때 그대로 */
export default function RecordsStack() {
  return (
    <Stack.Navigator
      initialRouteName="DcaHome"
      screenOptions={{ header: (props: NativeStackHeaderProps) => <PillHeader {...props} title="모으기" tabs={TABS} /> }}
    >
      <Stack.Screen name="DcaHome" component={DcaHomeScreen} />
      <Stack.Screen name="SpacexOverview">{() => <SpacexOverviewScreen symbol="SPCX" />}</Stack.Screen>
      <Stack.Screen name="UproOverview">{() => <SpacexOverviewScreen symbol="UPRO" />}</Stack.Screen>
      <Stack.Screen name="SpacexEntries" component={SpacexEntriesScreen} />
    </Stack.Navigator>
  );
}
