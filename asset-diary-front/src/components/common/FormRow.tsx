import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../../lib/theme';
import { Icon } from './Icon';

interface FormRowProps {
  label: string;
  value: string;
  placeholder?: string;
  onPress?: () => void;
}

export default function FormRow({ label, value, placeholder = '선택', onPress }: FormRowProps) {
  const theme = useTheme();
  const isEmpty = !value;
  return (
    <TouchableOpacity
      style={[styles.row, { borderBottomColor: theme.border }]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.6 : 1}
    >
      <Text style={[styles.label, { color: theme.textMuted }]}>{label}</Text>
      <Text style={[styles.value, { color: isEmpty ? theme.textMuted : theme.text }, isEmpty && styles.placeholder]}>
        {isEmpty ? placeholder : value}
      </Text>
      {onPress && Icon.chevronRight(theme.textMuted)}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  label: { width: 90, fontSize: 14 },
  value: { flex: 1, fontSize: 14, fontWeight: '600' },
  placeholder: { fontWeight: '400' },
});
