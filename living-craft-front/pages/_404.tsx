import { createRoute } from '@granite-js/react-native';
import { colors } from '@toss/tds-colors';
import { Button } from '@toss/tds-react-native';
import { StyleSheet, Text, View } from 'react-native';

export const Route = createRoute('/_404', {
  component: Page,
});

function Page() {
  const navigation = Route.useNavigation();

  return (
    <View style={styles.container}>
      <Text style={styles.errorCode}>404</Text>
      <Text style={styles.title}>페이지를 찾을 수 없습니다</Text>
      <Text style={styles.description}>요청하신 페이지가 존재하지 않거나{'\n'}이동되었을 수 있습니다</Text>
      <Button onPress={() => navigation.navigate('/')} display="full" containerStyle={{ marginTop: 24 }}>
        <Text style={styles.buttonText}>홈으로 이동</Text>
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: colors.background,
  },
  errorCode: {
    fontSize: 72,
    fontWeight: 'bold',
    color: colors.blue500,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.grey900,
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: colors.grey600,
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
