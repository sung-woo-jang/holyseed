import { AppsInToss } from '@apps-in-toss/framework';
import { PublicLayout } from '@components/layouts/PublicLayout';
import type { InitialProps } from '@granite-js/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TDSProvider } from '@toss/tds-react-native';
import type { PropsWithChildren } from 'react';

import { context } from '../require.context';

/**
 * TanStack Query Client 설정
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60000, // 1분
      gcTime: 300000, // 5분 (cacheTime -> gcTime으로 변경됨)
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

function AppContainer({ children }: PropsWithChildren<InitialProps>) {
  return (
    <QueryClientProvider client={queryClient}>
      <TDSProvider>
        <PublicLayout>{children}</PublicLayout>
      </TDSProvider>
    </QueryClientProvider>
  );
}

export default AppsInToss.registerApp(AppContainer, { context });
