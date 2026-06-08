import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../lib/theme';

interface EmptyStateProps {
  icon?: string;
  title: string;
  desc?: string;
  compact?: boolean;
}

export default function EmptyState({ icon = '📭', title, desc, compact = false }: EmptyStateProps) {
  const theme = useTheme();
  return (
    <View style={[styles.container, compact && styles.compact]}>
      <Text style={[styles.icon, compact && styles.iconCompact]}>{icon}</Text>
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      {desc && <Text style={[styles.desc, { color: theme.textMuted }]}>{desc}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { justifyContent: 'center', alignItems: 'center', paddingVertical: 48, paddingHorizontal: 32, gap: 8 },
  compact: { paddingVertical: 28 },
  icon: { fontSize: 40 },
  iconCompact: { fontSize: 32 },
  title: { fontSize: 15, fontWeight: '600', textAlign: 'center' },
  desc: { fontSize: 13, textAlign: 'center', lineHeight: 18 },
});
