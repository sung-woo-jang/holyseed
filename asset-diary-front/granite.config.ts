import { appsInToss } from '@apps-in-toss/framework/plugins';
import { hermes } from '@granite-js/plugin-hermes';
import { router } from '@granite-js/plugin-router';
import { defineConfig } from '@granite-js/react-native/config';

export default defineConfig({
  appName: 'asset-diary',
  scheme: 'intoss',
  plugins: [
    router(),
    hermes(),
    appsInToss({
      brand: {
        displayName: '자산일기',
        primaryColor: '#3182F6',
        icon: '',
      },
      permissions: [],
    }),
  ],
});
