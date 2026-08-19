import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../lib/theme';
import TossEmoji from './TossEmoji';

interface EmptyStateProps {
  /** TE 코드 (toss-emoji.ts). 미지정 시 mailbox */
  iconCode?: string;
  title: string;
  desc?: string;
  compact?: boolean;
}

export default function EmptyState({ iconCode = '1F4ED', title, desc, compact = false }: EmptyStateProps) {
  const theme = useTheme();
  return (
    <View style={[styles.root, { paddingVertical: compact ? 28 : 48 }]}>
      <TossEmoji code={iconCode} size={compact ? 40 : 48} />
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      {desc && <Text style={[styles.desc, { color: theme.textMuted }]}>{desc}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 10 },
  title: { fontSize: 15, fontWeight: '600', textAlign: 'center' },
  desc: { fontSize: 13, textAlign: 'center', lineHeight: 18 },
});
