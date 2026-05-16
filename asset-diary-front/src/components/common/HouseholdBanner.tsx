import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../lib/theme';
import TossEmoji from './TossEmoji';
import { Icon } from './Icon';
import { TE } from '../../lib/toss-emoji';

interface HouseholdBannerProps {
  name: string;
  memberCount: number;
  ownerName: string;
  onRefresh?: () => void;
}

export default function HouseholdBanner({ name, memberCount, ownerName, onRefresh }: HouseholdBannerProps) {
  const theme = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <TossEmoji code={TE.house} size={48} bg={theme.brandSoft} borderRadius={12} />
      <View style={styles.info}>
        <Text style={[styles.name, { color: theme.text }]}>{name}</Text>
        <Text style={[styles.meta, { color: theme.textMuted }]}>{memberCount}명 · {ownerName} 님이 소유</Text>
      </View>
      {onRefresh && (
        <TouchableOpacity onPress={onRefresh} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          {Icon.refresh(theme.textMuted)}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 20,
    marginBottom: 8,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  meta: { fontSize: 13 },
});
