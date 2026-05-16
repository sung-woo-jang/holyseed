import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../lib/theme';

interface SegmentedProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  small?: boolean;
}

export default function Segmented({ options, value, onChange, small = false }: SegmentedProps) {
  const theme = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {options.map(o => {
        const active = o === value;
        return (
          <TouchableOpacity
            key={o}
            onPress={() => onChange(o)}
            style={[
              styles.btn,
              small && styles.btnSmall,
              active && { backgroundColor: theme.card, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
            ]}
          >
            <Text style={[styles.text, small && styles.textSmall, { color: active ? theme.text : theme.textMuted }]}>
              {o}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', padding: 2, borderRadius: 8 },
  btn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 },
  btnSmall: { paddingVertical: 4, paddingHorizontal: 10 },
  text: { fontSize: 13, fontWeight: '600' },
  textSmall: { fontSize: 11 },
});
