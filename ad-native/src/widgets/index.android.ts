import { registerWidgetTaskHandler } from 'react-native-android-widget';
import { widgetTaskHandler } from './registry';

export { refreshAllWidgets } from './registry';

export function registerWidgets(): void {
  registerWidgetTaskHandler(widgetTaskHandler);
}
