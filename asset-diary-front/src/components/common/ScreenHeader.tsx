import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../lib/theme';
import { Icon } from './Icon';

interface ScreenHeaderProps {
  title: string;
  onBack?: () => void;
  right?: React.ReactNode;
}

export default function ScreenHeader({ title, onBack, right }: ScreenHeaderProps) {
  const theme = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: theme.card }]}>
      {onBack ? (
        <TouchableOpacity onPress={onBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.side}>
          {Icon.back(theme.text)}
        </TouchableOpacity>
      ) : (
        <View style={styles.side} />
      )}
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      {right ? <View style={styles.rightSlot}>{right}</View> : <View style={styles.side} />}
    </View>
  );
}

interface HeaderButtonProps {
  label: string;
  onPress: () => void;
}

export function HeaderButton({ label, onPress }: HeaderButtonProps) {
  const theme = useTheme();
  return (
    <TouchableOpacity onPress={onPress} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
      <Text style={[styles.btnText, { color: theme.brand }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  side: { width: 32 },
  title: { flex: 1, fontSize: 18, fontWeight: '700', textAlign: 'center' },
  rightSlot: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end', minWidth: 32 },
  btnText: { fontSize: 14, fontWeight: '600' },
});
