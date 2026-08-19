import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { toLocalDateString } from '../../lib/date';

interface DatePickerProps {
  visible: boolean;
  /** 현재 선택된 날짜 (YYYY-MM-DD) */
  value: string;
  onSelect: (date: string) => void;
  onClose: () => void;
  /** 이후 날짜 선택 불가 (기본: 제한 없음) */
  maxDate?: string;
}

/** 네이티브 날짜 다이얼로그 — Android/iOS 모두 표준 UX라 커스텀 캘린더 대신 이걸 사용 */
export default function DatePicker({ visible, value, onSelect, onClose, maxDate }: DatePickerProps) {
  if (!visible) return null;

  function handleChange(event: DateTimePickerEvent, selected?: Date) {
    onClose();
    if (event.type === 'set' && selected) onSelect(toLocalDateString(selected));
  }

  return (
    <DateTimePicker
      value={value ? new Date(value) : new Date()}
      mode="date"
      display="default"
      maximumDate={maxDate ? new Date(maxDate) : undefined}
      onChange={handleChange}
    />
  );
}
