import type { ReactNode } from 'react';
import { Pressable, Text } from 'react-native';
import { useTheme } from '../../lib/theme';

interface TextButtonProps {
  typography?: 't5' | 't6';
  variant?: 'clear' | 'underline';
  color?: string;
  onPress?: () => void;
  children: ReactNode;
}

export default function TextButton({ typography = 't5', variant = 'clear', color, onPress, children }: TextButtonProps) {
  const theme = useTheme();
  return (
    <Pressable onPress={onPress} hitSlop={6}>
      <Text
        style={{
          color: color ?? theme.brand,
          fontSize: typography === 't6' ? 13 : 14,
          fontWeight: '600',
          textDecorationLine: variant === 'underline' ? 'underline' : 'none',
        }}
      >
        {children}
      </Text>
    </Pressable>
  );
}
