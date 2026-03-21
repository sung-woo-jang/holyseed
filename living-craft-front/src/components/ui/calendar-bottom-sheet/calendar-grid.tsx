import { colors } from '@toss/tds-colors';
import { StyleSheet, Text, View } from 'react-native';

import { DateCell } from './date-cell';
import { type CalendarDay, formatDateToString, isDateDisabled } from './utils';

interface CalendarGridProps {
  year: number;
  month: number;
  calendarDays: CalendarDay[];
  selectedDate: Date | null;
  minDate?: Date;
  maxDate?: Date;
  disabledDates?: Date[];
  onSelectDate: (date: Date) => void;
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export function CalendarGrid({
  calendarDays,
  selectedDate,
  minDate,
  maxDate,
  disabledDates,
  onSelectDate,
}: CalendarGridProps) {
  const selectedDateString = selectedDate ? formatDateToString(selectedDate) : null;

  return (
    <View style={styles.container}>
      {/* 요일 헤더 */}
      <View style={styles.weekdayHeader}>
        {WEEKDAYS.map((weekday, index) => (
          <View key={index} style={styles.weekdayCell}>
            <Text style={styles.weekdayText}>{weekday}</Text>
          </View>
        ))}
      </View>

      {/* 날짜 그리드 */}
      <View style={styles.dateGrid}>
        {calendarDays.map((day, index) => {
          const isSelected =
            day.fullDate && selectedDateString ? formatDateToString(day.fullDate) === selectedDateString : false;
          const isDisabled = isDateDisabled(day.fullDate, minDate, maxDate, disabledDates);

          return (
            <DateCell
              key={index}
              date={day.date}
              isSelected={isSelected}
              isToday={day.isToday}
              isDisabled={isDisabled}
              isCurrentMonth={day.isCurrentMonth}
              onPress={() => {
                if (day.fullDate && !isDisabled) {
                  onSelectDate(day.fullDate);
                }
              }}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 4,
    paddingVertical: 0,
    gap: 5,
  },
  weekdayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 2,
  },
  weekdayCell: {
    width: 40,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekdayText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.grey400,
    textAlign: 'center',
  },
  dateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: 5,
  },
});
