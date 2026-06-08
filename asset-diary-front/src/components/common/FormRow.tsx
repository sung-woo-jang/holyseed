import React from 'react';
import { ListRow } from '@toss/tds-react-native';

interface FormRowProps {
  label: string;
  value: string;
  placeholder?: string;
  onPress?: () => void;
}

export default function FormRow({ label, value, placeholder = '선택', onPress }: FormRowProps) {
  const displayValue = value || placeholder;
  return (
    <ListRow
      contents={label}
      right={displayValue}
      withArrow={!!onPress}
      onPress={onPress}
      verticalPadding="small"
    />
  );
}
