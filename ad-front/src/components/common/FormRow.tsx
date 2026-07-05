import ListRow from '../ui/ListRow';
import { useTheme } from '../../lib/theme';

interface FormRowProps {
  label: string;
  value: string;
  placeholder?: string;
  onPress?: () => void;
}

export default function FormRow({ label, value, placeholder = '선택', onPress }: FormRowProps) {
  const theme = useTheme();
  const isEmpty = !value;
  const displayValue = value || placeholder;
  return (
    <ListRow
      contents={<span style={{ fontSize: 14, fontWeight: 500, color: theme.text }}>{label}</span>}
      right={
        <span style={{ fontSize: 14, fontWeight: 600, color: isEmpty ? theme.textMuted : theme.text }}>
          {displayValue}
        </span>
      }
      withArrow={!!onPress}
      onPress={onPress}
      verticalPadding="small"
    />
  );
}
