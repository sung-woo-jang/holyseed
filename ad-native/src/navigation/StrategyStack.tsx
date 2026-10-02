import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { createNativeStackNavigator, type NativeStackHeaderProps } from '@react-navigation/native-stack';
import Segmented from '../components/common/Segmented';
import LaofusHomeScreen from '../screens/laofus/LaofusHomeScreen';
import LaofusSystemScreen from '../screens/laofus/LaofusSystemScreen';
import LaofusCyclesScreen from '../screens/laofus/LaofusCyclesScreen';
import LaofusCycleDetailScreen from '../screens/laofus/LaofusCycleDetailScreen';
import LaofusTradeDetailScreen from '../screens/laofus/LaofusTradeDetailScreen';
import VrOverviewScreen from '../screens/vr/VrOverviewScreen';
import VrFillsScreen from '../screens/vr/VrFillsScreen';
import VrLadderScreen from '../screens/vr/VrLadderScreen';
import VrTrendScreen from '../screens/vr/VrTrendScreen';
import VrSystemScreen from '../screens/vr/VrSystemScreen';
import PillHeader, { BackHeader, replaceRoute, type PillTab } from './PillHeader';
import { getLaofusLastStrategy } from '../lib/prefs';
import { lastRouteOf, rememberStrategyRoute, STRATEGY_FIRST_ROUTE, strategyOfRoute, type Strategy } from '../lib/strategy-nav';
import { useTheme } from '../lib/theme';

export type StrategyStackParamList = {
  LaofusHome: undefined;
  LaofusCycles: undefined;
  LaofusCycleDetail: { cycleNo: number };
  LaofusTradeDetail: { cycleNo: number; tradeId: number };
  LaofusSystem: undefined;
  VrOverview: undefined;
  VrFills: undefined;
  VrLadder: undefined;
  VrTrend: undefined;
  VrSystem: undefined;
};

const LAOFUS_TABS: PillTab[] = [
  { name: 'LaofusHome', label: '개요' },
  { name: 'LaofusCycles', label: '사이클 기록' },
  { name: 'LaofusSystem', label: '시스템' },
];

const VR_TABS: PillTab[] = [
  { name: 'VrOverview', label: '개요' },
  { name: 'VrFills', label: '체결 내역' },
  { name: 'VrLadder', label: '매수/매도표' },
  { name: 'VrTrend', label: '추이' },
  { name: 'VrSystem', label: '시스템' },
];

const SEGMENTS: Record<string, Strategy> = { 무한매수법: 'laofus', VR: 'vr' };

const Stack = createNativeStackNavigator<StrategyStackParamList>();

function StrategyHeader(props: NativeStackHeaderProps) {
  const { navigation, route } = props;
  const strategy = strategyOfRoute(route.name);

  useEffect(() => {
    rememberStrategyRoute(route.name);
  }, [route.name]);

  if (route.name === 'LaofusCycleDetail') return <BackHeader navigation={navigation} title="사이클 상세" />;
  if (route.name === 'LaofusTradeDetail') return <BackHeader navigation={navigation} title="체결 상세" />;

  function switchTo(next: Strategy) {
    if (next === strategy) return;
    replaceRoute(navigation, lastRouteOf(next));
  }

  return (
    <PillHeader
      {...props}
      title="전략"
      tabs={strategy === 'vr' ? VR_TABS : LAOFUS_TABS}
      topSlot={
        <Segmented
          options={Object.keys(SEGMENTS)}
          value={strategy === 'vr' ? 'VR' : '무한매수법'}
          onChange={(label) => switchTo(SEGMENTS[label]!)}
          small
        />
      }
    />
  );
}

/** "전략" 탭 — 무한매수법과 VR을 맨 위 세그먼트로 오가고, 안쪽은 같은 알약 이동. 마지막으로 본 전략부터 보여준다 */
export default function StrategyStack() {
  const theme = useTheme();
  const [initial, setInitial] = useState<keyof StrategyStackParamList | null>(null);

  useEffect(() => {
    let alive = true;
    getLaofusLastStrategy()
      .then((s) => alive && setInitial(STRATEGY_FIRST_ROUTE[s ?? 'laofus'] as keyof StrategyStackParamList))
      .catch(() => alive && setInitial('LaofusHome'));
    return () => {
      alive = false;
    };
  }, []);

  if (initial === null) return <View style={{ flex: 1, backgroundColor: theme.bg }} />;

  return (
    <Stack.Navigator initialRouteName={initial} screenOptions={{ header: (props) => <StrategyHeader {...props} /> }}>
      <Stack.Screen name="LaofusHome" component={LaofusHomeScreen} />
      <Stack.Screen name="LaofusCycles" component={LaofusCyclesScreen} />
      <Stack.Screen name="LaofusCycleDetail" component={LaofusCycleDetailScreen} />
      <Stack.Screen name="LaofusTradeDetail" component={LaofusTradeDetailScreen} />
      <Stack.Screen name="LaofusSystem" component={LaofusSystemScreen} />
      <Stack.Screen name="VrOverview" component={VrOverviewScreen} />
      <Stack.Screen name="VrFills" component={VrFillsScreen} />
      <Stack.Screen name="VrLadder" component={VrLadderScreen} />
      <Stack.Screen name="VrTrend" component={VrTrendScreen} />
      <Stack.Screen name="VrSystem" component={VrSystemScreen} />
    </Stack.Navigator>
  );
}
