import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '../../lib/theme';
import { Icon } from '../common/Icon';

interface ListRowProps {
  left?: ReactNode;
  contents?: ReactNode;
  right?: ReactNode;
  withArrow?: boolean;
  onPress?: () => void;
  verticalPadding?: 'none' | 'small' | 'medium' | 'large';
}

const VP: Record<NonNullable<ListRowProps['verticalPadding']>, number> = {
  none: 0,
  small: 8,
  medium: 14,
  large: 18,
};

export default function ListRow({ left, contents, right, withArrow = false, onPress, verticalPadding = 'medium' }: ListRowProps) {
  const theme = useTheme();
  const inner = (
    <>
      {left && <View style={styles.left}>{left}</View>}
      <View style={styles.contents}>{contents}</View>
      {right && <View style={styles.right}>{right}</View>}
      {withArrow && Icon.chevronRight(theme.textMuted)}
    </>
  );

  const rowStyle = [styles.row, { paddingVertical: VP[verticalPadding] }];

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [...rowStyle, { opacity: pressed ? 0.6 : 1 }]}>
        {inner}
      </Pressable>
    );
  }
  return <View style={rowStyle}>{inner}</View>;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20 },
  left: { flexShrink: 0 },
  contents: { flex: 1, minWidth: 0 },
  right: { flexShrink: 0, alignItems: 'flex-end' },
});
