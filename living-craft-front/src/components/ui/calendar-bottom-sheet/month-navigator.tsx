import { colors } from '@toss/tds-colors';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface MonthNavigatorProps {
  year: number;
  month: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

export function MonthNavigator({ year, month, onPrevMonth, onNextMonth }: MonthNavigatorProps) {
  const monthText = `${year}년 ${month}월`;

  return (
    <View style={styles.container}>
      <View style={styles.monthDisplay}>
        <Text style={styles.monthText}>{monthText}</Text>
      </View>
      <View style={styles.buttonGroup}>
        <TouchableOpacity style={styles.navButton} onPress={onPrevMonth}>
          <Text style={styles.navIcon}>‹</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={onNextMonth}>
          <Text style={styles.navIcon}>›</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  monthDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  monthText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.grey800,
  },
  buttonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  navButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navIcon: {
    fontSize: 24,
    color: colors.grey800,
    fontWeight: 'bold',
  },
});
