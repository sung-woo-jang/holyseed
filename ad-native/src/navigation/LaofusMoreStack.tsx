import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AppMoreScreen from '../screens/AppMoreScreen';
import SpacexOverviewScreen from '../screens/lab/spacex/SpacexOverviewScreen';
import SpacexEntriesScreen from '../screens/lab/spacex/SpacexEntriesScreen';
import { TE } from '../lib/toss-emoji';

export type LaofusMoreStackParamList = {
  MoreHome: undefined;
  SpacexOverview: undefined;
  SpacexEntries: undefined;
};

const Stack = createNativeStackNavigator<LaofusMoreStackParamList>();

/** 라오어 탭의 "더보기" — 공용 AppMoreScreen에 라오어 전용 메뉴(스페이스X)를 얹어서 보여준다 */
export default function LaofusMoreStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="MoreHome" options={{ title: '더보기' }}>
        {({ navigation }) => (
          <AppMoreScreen
            appName="라오어"
            menuItems={[
              {
                emojiCode: TE.rocket,
                label: '스페이스X',
                detail: '매일 매수 기록',
                onPress: () => navigation.navigate('SpacexOverview'),
              },
            ]}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="SpacexOverview" component={SpacexOverviewScreen} options={{ title: '스페이스X' }} />
      <Stack.Screen name="SpacexEntries" component={SpacexEntriesScreen} options={{ title: '스페이스X 기록' }} />
    </Stack.Navigator>
  );
}
