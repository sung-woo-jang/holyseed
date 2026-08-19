import { Switch as RNSwitch } from 'react-native';
import { useTheme } from '../../lib/theme';

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}

export default function Switch({ checked, onCheckedChange, disabled = false }: SwitchProps) {
  const theme = useTheme();
  return (
    <RNSwitch
      value={checked}
      onValueChange={onCheckedChange}
      disabled={disabled}
      trackColor={{ false: theme.border, true: theme.brand }}
      thumbColor="#fff"
    />
  );
}
