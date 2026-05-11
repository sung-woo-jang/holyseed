import { AppsInToss } from '@apps-in-toss/framework';
import { type InitialProps } from '@granite-js/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { type PropsWithChildren } from 'react';
import AuthBootstrap from './components/AuthBootstrap';
import { context } from '../require.context';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 10_000, retry: 1 },
  },
});

function AppContainer({ children }: PropsWithChildren<InitialProps>) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthBootstrap>{children}</AuthBootstrap>
    </QueryClientProvider>
  );
}

export default AppsInToss.registerApp(AppContainer, { context });
