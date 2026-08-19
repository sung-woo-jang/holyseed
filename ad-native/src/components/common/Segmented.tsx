import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../lib/theme';

interface SegmentedProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  small?: boolean;
  /** 'fixed' = 부모 폭 꽉 채움(기본), 'fluid' = 콘텐츠 폭에 맞춤 */
  alignment?: 'fixed' | 'fluid';
}

export default function Segmented({ options, value, onChange, small = false, alignment = 'fixed' }: SegmentedProps) {
  const theme = useTheme();
  return (
    <View style={[styles.wrap, { backgroundColor: theme.bg }, alignment === 'fluid' && { alignSelf: 'flex-start' }]}>
      {options.map((o) => {
        const active = o === value;
        return (
          <Pressable
            key={o}
            onPress={() => onChange(o)}
            style={[
              styles.item,
              { paddingVertical: small ? 5 : 8, paddingHorizontal: small ? 10 : 14 },
              active && { backgroundColor: theme.card },
            ]}
          >
            <Text style={{ fontSize: small ? 12 : 13, fontWeight: '700', color: active ? theme.text : theme.textMuted }}>{o}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', borderRadius: 999, padding: 3, gap: 2 },
  item: { borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
});
