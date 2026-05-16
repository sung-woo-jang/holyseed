import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../lib/theme';
import type { MemberRole } from '../../types/api';

const ROLE_LABEL: Record<MemberRole, string> = {
  OWNER: '소유자',
  EDITOR: '편집자',
  VIEWER: '조회자',
};

export default function RoleBadge({ role }: { role: MemberRole }) {
  const theme = useTheme();
  const bgColor = role === 'OWNER' ? theme.brandSoft : theme.bg;
  const textColor = role === 'OWNER' ? theme.brand : role === 'EDITOR' ? theme.text : theme.textMuted;
  return (
    <View style={[styles.badge, { backgroundColor: bgColor }]}>
      <Text style={[styles.text, { color: textColor }]}>{ROLE_LABEL[role]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  text: { fontSize: 11, fontWeight: '600' },
});
