import { colors } from '@toss/tds-colors';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

interface DateCellProps {
  date: number | null;
  isSelected: boolean;
  isToday: boolean;
  isDisabled: boolean;
  isCurrentMonth: boolean;
  onPress: () => void;
}

export function DateCell({ date, isSelected, isToday, isDisabled, isCurrentMonth, onPress }: DateCellProps) {
  if (date === null) {
    return <TouchableOpacity style={styles.cell} disabled />;
  }

  return (
    <TouchableOpacity
      style={[styles.cell, isSelected && styles.cellSelected, isToday && !isSelected && styles.cellToday]}
      onPress={onPress}
      disabled={isDisabled}
    >
      <Text
        style={[
          styles.dateText,
          !isCurrentMonth && styles.dateTextOtherMonth,
          isSelected && styles.dateTextSelected,
          isToday && !isSelected && styles.dateTextToday,
          isDisabled && styles.dateTextDisabled,
        ]}
      >
        {date}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cell: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  cellSelected: {
    backgroundColor: colors.blue500,
  },
  cellToday: {
    borderWidth: 1,
    borderColor: colors.blue500,
  },
  dateText: {
    fontSize: 20,
    fontWeight: '500',
    color: colors.grey800,
    textAlign: 'center',
  },
  dateTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  dateTextToday: {
    color: colors.blue500,
    fontWeight: '600',
  },
  dateTextOtherMonth: {
    color: colors.grey400,
  },
  dateTextDisabled: {
    color: colors.grey300,
  },
});
