import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useTheme } from '../../lib/theme';
import Loader from './Loader';

interface ButtonProps {
  display?: 'full' | 'inline';
  size?: 'big' | 'medium' | 'small';
  type?: 'primary' | 'danger' | 'dark';
  /** TDS 호환: 'fill'(기본) | 'weak' */
  style?: 'fill' | 'weak';
  disabled?: boolean;
  loading?: boolean;
  leftAccessory?: ReactNode;
  onPress?: () => void;
  children: ReactNode;
}

const SIZE_STYLE = {
  big: { paddingVertical: 16, paddingHorizontal: 20, fontSize: 17, borderRadius: 14 },
  medium: { paddingVertical: 11, paddingHorizontal: 16, fontSize: 15, borderRadius: 12 },
  small: { paddingVertical: 7, paddingHorizontal: 12, fontSize: 13, borderRadius: 8 },
};

export default function Button({
  display = 'inline',
  size = 'medium',
  type = 'primary',
  style: variant = 'fill',
  disabled = false,
  loading = false,
  leftAccessory,
  onPress,
  children,
}: ButtonProps) {
  const theme = useTheme();
  const sizeStyle = SIZE_STYLE[size];

  const palette = {
    primary: { fillBg: theme.brand, weakBg: theme.brandSoft, weakFg: theme.brand },
    danger: { fillBg: theme.danger, weakBg: 'rgba(255,59,48,0.12)', weakFg: theme.danger },
    dark: { fillBg: theme.text, weakBg: 'rgba(139,149,161,0.15)', weakFg: theme.text },
  }[type];
  const bg = variant === 'weak' ? palette.weakBg : palette.fillBg;
  const fg = variant === 'weak' ? palette.weakFg : type === 'dark' ? theme.card : '#fff';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: bg,
          borderRadius: sizeStyle.borderRadius,
          paddingVertical: sizeStyle.paddingVertical,
          paddingHorizontal: sizeStyle.paddingHorizontal,
          opacity: disabled ? 0.4 : pressed ? 0.8 : 1,
          alignSelf: display === 'full' ? 'stretch' : 'flex-start',
        },
      ]}
    >
      {loading ? (
        <Loader color={variant === 'weak' ? fg : '#fff'} />
      ) : (
        <>
          {leftAccessory && <>{leftAccessory}</>}
          <Text style={{ fontSize: sizeStyle.fontSize, fontWeight: '700', color: fg, marginLeft: leftAccessory ? 6 : 0 }}>
            {children}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
});
