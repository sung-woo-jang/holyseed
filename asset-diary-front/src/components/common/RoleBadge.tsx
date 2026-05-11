import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { MemberRole } from '../../types/api';

const ROLE_LABEL: Record<MemberRole, string> = {
  OWNER: '소유자',
  EDITOR: '편집자',
  VIEWER: '조회자',
};

const ROLE_COLOR: Record<MemberRole, string> = {
  OWNER: '#3182F6',
  EDITOR: '#34C759',
  VIEWER: '#8B95A1',
};

export default function RoleBadge({ role }: { role: MemberRole }) {
  return (
    <View style={[styles.badge, { backgroundColor: ROLE_COLOR[role] + '20' }]}>
      <Text style={[styles.text, { color: ROLE_COLOR[role] }]}>{ROLE_LABEL[role]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  text: { fontSize: 11, fontWeight: '700' },
});
