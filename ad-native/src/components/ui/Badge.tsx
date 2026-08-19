import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../lib/theme';

type BadgeType = 'blue' | 'teal' | 'elephant' | 'red' | 'green';

interface BadgeProps {
  type?: BadgeType;
  badgeStyle?: 'weak' | 'fill';
  size?: 'tiny' | 'small' | 'medium';
  children: ReactNode;
}

const SIZE_STYLE = {
  tiny: { fontSize: 10, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4 },
  small: { fontSize: 12, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  medium: { fontSize: 13, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
};

export default function Badge({ type = 'blue', badgeStyle = 'fill', size = 'small', children }: BadgeProps) {
  const theme = useTheme();
  const colors: Record<BadgeType, { weakBg: string; weakFg: string; fillBg: string }> = {
    blue: { weakBg: theme.brandSoft, weakFg: theme.brand, fillBg: theme.brand },
    teal: { weakBg: 'rgba(0,184,176,0.14)', weakFg: '#00A49D', fillBg: '#00B8B0' },
    elephant: { weakBg: 'rgba(139,149,161,0.14)', weakFg: theme.textMuted, fillBg: theme.textMuted },
    red: { weakBg: 'rgba(255,59,48,0.12)', weakFg: theme.danger, fillBg: theme.danger },
    green: { weakBg: 'rgba(52,199,89,0.14)', weakFg: '#2AA14A', fillBg: '#34C759' },
  };
  const c = colors[type];
  const sizeStyle = SIZE_STYLE[size];
  const bg = badgeStyle === 'weak' ? c.weakBg : c.fillBg;
  const fg = badgeStyle === 'weak' ? c.weakFg : '#fff';

  return (
    <View style={[styles.badge, { backgroundColor: bg, borderRadius: sizeStyle.borderRadius, paddingHorizontal: sizeStyle.paddingHorizontal, paddingVertical: sizeStyle.paddingVertical }]}>
      <Text style={{ fontSize: sizeStyle.fontSize, fontWeight: '600', color: fg }}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center' },
});
