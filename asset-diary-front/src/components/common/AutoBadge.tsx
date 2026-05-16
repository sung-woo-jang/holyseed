import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../lib/theme';

export default function AutoBadge() {
  const theme = useTheme();
  return (
    <View style={[styles.badge, { backgroundColor: theme.brandSoft }]}>
      <Text style={[styles.text, { color: theme.brand }]}>자동</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4 },
  text: { fontSize: 9, fontWeight: '700' },
});
