import { registerRootComponent } from 'expo';

import App from './App';
import { registerWidgets } from './src/widgets';

// 홈 화면 위젯의 백그라운드(headless) 갱신 핸들러 — 앱 UI가 떠 있지 않아도 이 번들이 로드되면 등록된다
registerWidgets();

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
