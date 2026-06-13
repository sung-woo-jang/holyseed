import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { ListRow } from '@toss/tds-react-native';
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
      contents={<Text style={[styles.label, { color: theme.text }]}>{label}</Text>}
      right={
        <Text style={[styles.value, { color: isEmpty ? theme.textMuted : theme.text }]}>
          {displayValue}
        </Text>
      }
      withArrow={!!onPress}
      onPress={onPress}
      verticalPadding="small"
    />
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 14, fontWeight: '500' },
  value: { fontSize: 14, fontWeight: '600' },
});
