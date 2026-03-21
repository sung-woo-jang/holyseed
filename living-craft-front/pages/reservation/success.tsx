import { createRoute } from '@granite-js/react-native';
import { colors } from '@toss/tds-colors';
import { Asset, Button } from '@toss/tds-react-native';
import { StyleSheet, Text, View } from 'react-native';

export const Route = createRoute('/reservation/success', {
  component: Page,
});

/**
 * 예약 완료 페이지
 */
function Page() {
  const navigation = Route.useNavigation();

  const handleGoToMyReservations = () => {
    navigation.navigate('/my/reservations');
  };

  const handleGoHome = () => {
    navigation.navigate('/');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* 성공 아이콘 */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Asset.Icon
              name="icon-checkmark-blue"
              frameShape={Asset.frameShape.CleanW24}
              color={colors.blue500}
            />
          </View>
        </View>

        {/* 성공 메시지 */}
        <View style={styles.messageContainer}>
          <Text style={styles.title}>예약이 완료되었습니다!</Text>
          <Text style={styles.description}>
            예약이 성공적으로 접수되었습니다.{'\n'}
            예약 내역에서 확인하실 수 있습니다.
          </Text>
        </View>

        {/* 안내 정보 */}
        <View style={styles.infoBox}>
          <View style={styles.infoRow}>
            <Asset.Icon
              name="icon-info-circle-blue"
              frameShape={Asset.frameShape.CleanW20}
              color={colors.blue500}
            />
            <Text style={styles.infoText}>
              예약 확정 후 알림을 보내드립니다.
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Asset.Icon
              name="icon-calendar-check-blue"
              frameShape={Asset.frameShape.CleanW20}
              color={colors.blue500}
            />
            <Text style={styles.infoText}>
              견적 날짜와 시간을 확인해주세요.
            </Text>
          </View>
        </View>
      </View>

      {/* 액션 버튼 */}
      <View style={styles.actions}>
        <View style={styles.buttonContainer}>
          <Button
            display="full"
            onPress={handleGoToMyReservations}
          >
            내 예약 보기
          </Button>
        </View>
        <View style={styles.buttonContainer}>
          <Button
            display="block"
            onPress={handleGoHome}
          >
            홈으로
          </Button>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  iconContainer: {
    marginBottom: 32,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.blue50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.grey900,
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: colors.grey600,
    textAlign: 'center',
    lineHeight: 24,
  },
  infoBox: {
    backgroundColor: colors.blue50,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    width: '100%',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.grey700,
    lineHeight: 20,
  },
  actions: {
    padding: 20,
    gap: 12,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.grey200,
  },
  buttonContainer: {
    width: '100%',
  },
});
