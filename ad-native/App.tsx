import 'react-native-gesture-handler';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import RootNavigator from './src/navigation/RootNavigator';

// 구글 로그인 인앱 브라우저 세션이 앱 복귀 시 제대로 닫히도록 앱 시작 시 1회 호출
WebBrowser.maybeCompleteAuthSession();

// 웹에서는 #root가 뷰포트 전체 높이를 차지해야 flex:1 트리(하단 탭바 포함)가 화면 바닥에 고정된다.
// expo-router 없이 순수 React Navigation을 쓰면 이 리셋이 기본 제공되지 않아 직접 주입한다.
if (Platform.OS === 'web') {
  const style = document.createElement('style');
  style.innerHTML = `html, body, #root { height: 100%; margin: 0; }`;
  document.head.appendChild(style);
}

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 10_000, retry: 1 } },
});

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <BottomSheetModalProvider>
            <NavigationContainer>
              <RootNavigator />
              <StatusBar style="auto" />
            </NavigationContainer>
          </BottomSheetModalProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
