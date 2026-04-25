import { createRoute } from '@granite-js/react-native';
import { Text } from '@toss/tds-react-native';
import { View, StyleSheet } from 'react-native';

export const Route = createRoute('/', {
  component: Page,
});

function Page() {
  return (
    <View style={styles.container}>
      <Text typography="t1">Starter Ready</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
