import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface EmptyStateProps {
  icon?: string;
  title: string;
  desc?: string;
}

export default function EmptyState({ icon = '📭', title, desc }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      {desc && <Text style={styles.desc}>{desc}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 8 },
  icon: { fontSize: 40 },
  title: { fontSize: 16, fontWeight: '600', color: '#191F28', textAlign: 'center' },
  desc: { fontSize: 13, color: '#8B95A1', textAlign: 'center', lineHeight: 18 },
});
